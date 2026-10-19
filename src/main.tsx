
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient, type User} from '@supabase/supabase-js';
import { readSheet } from 'read-excel-file/browser';
import './styles.css';

const URL=import.meta.env.VITE_SUPABASE_URL;
const KEY=import.meta.env.VITE_SUPABASE_ANON_KEY;
const db=URL&&KEY?createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true}}):null;
type Subject={id:string;grade_level:number;field_id:string|null;curriculum_plan_id:string;subjects:{name_ar:string;code:string}};
type Q={id:string;question:string;topic:string;difficulty:number;options:Record<string,string>};
type Session={attemptId:string;questions:Q[];mode:string};
type Review={id:string;question:string;topic:string;options:Record<string,string>;selected:string|null;correctAnswer:string;isCorrect:boolean;explanation:string};
type Result={score:number;correctCount:number;total:number;review:Review[]};
const chars:Record<string,string>={A:'أ',B:'ب',C:'ج',D:'د'};
const why=(e:unknown)=>e instanceof Error?e.message:String(e);
async function functionCall<T=any>(name:'quiz'|'admin'|'privacy',body:Record<string,unknown>):Promise<T>{
 if(!db)throw Error('لم يتم ضبط الاتصال بقاعدة البيانات');
 const {data,error}=await db.functions.invoke(name,{body});
 if(error){try{const p=await (error as any).context?.json();throw Error(p?.error||error.message)}catch(ex){throw ex instanceof SyntaxError?Error(error.message):ex}}
 if(data?.error)throw Error(data.error);
 return data as T;
}
function App(){
 const [user,setUser]=useState<User|null>(null),[role,setRole]=useState(''),[tab,setTab]=useState('home');
 const [catalog,setCatalog]=useState<Subject[]>([]),[inventory,setInventory]=useState<Record<string,number>>({}),[cohorts,setCohorts]=useState<{id:string;label:string}[]>([]),[mappings,setMappings]=useState<{cohort_id:string;grade_level:number;curriculum_plan_id:string}[]>([]),[fields,setFields]=useState<{id:string;name:string}[]>([]);
 const [cohort,setCohort]=useState(''),[grade,setGrade]=useState(11),[field,setField]=useState(''),[subject,setSubject]=useState('');
 const [session,setSession]=useState<Session|null>(null),[answers,setAnswers]=useState<Record<string,string>>({}),[current,setCurrent]=useState(0),[result,setResult]=useState<Result|null>(null),[history,setHistory]=useState<any[]>([]),[resultSubject,setResultSubject]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[signup,setSignup]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [adminData,setAdminData]=useState<any>(null),[adminSubjects,setAdminSubjects]=useState(''),[questionRows,setQuestionRows]=useState<any[]>([]),[imports,setImports]=useState<any[]>([]);
 const [planName,setPlanName]=useState(''),[academicYear,setAcademicYear]=useState('2026/2027'),[ref,setRef]=useState('https://www.nccd.gov.jo/ar/pages/TextBooksGrade/118'),[label,setLabel]=useState(''),[planId,setPlanId]=useState(''),[subId,setSubId]=useState(''),[fieldId,setFieldId]=useState(''),[examSession,setExamSession]=useState('2026/2027'),[cohortId,setCohortId]=useState('');
 const [adminGrade,setAdminGrade]=useState(11);
 const [consent,setConsent]=useState(()=>localStorage.getItem('t360_cloud_agreement')==='yes');
 const [consentError,setConsentError]=useState('');
 const consentCheck=()=>{if(!consent){setConsentError('للاختبار السحابي يجب الموافقة أولاً على تخزين المحاولات والنتائج. يمكنك استخدام الاختبار المحلي دون الموافقة.');setTab('home');return false;}setConsentError('');return true;};
 const visible=catalog.filter(s=>s.grade_level===grade && mappings.some(m=>m.cohort_id===cohort&&m.grade_level===grade&&m.curriculum_plan_id===s.curriculum_plan_id) && (grade===11||!s.field_id||s.field_id===field));
 const chosen=visible.find(s=>s.id===subject)||visible[0];
 async function reload(){
  if(!db)return;
  const [c,m,s,f,i]=await Promise.all([
   db.from('cohorts').select('id,label').eq('active',true),
   db.from('cohort_curriculum_assignments').select('cohort_id,grade_level,curriculum_plan_id').eq('verified',true),
   db.from('plan_subjects').select('id,grade_level,field_id,curriculum_plan_id,subjects!inner(name_ar,code)').eq('verification_status','verified').eq('is_ministerial_exam',true),
   db.from('fields').select('id,name'),
   db.from('question_inventory').select('plan_subject_id,published_count')
  ]);
  const failed=[c,m,s,f,i].find(q=>q.error);if(failed?.error)throw failed.error;
  setCohorts((c.data||[]) as any);setMappings((m.data||[]) as any);setCatalog((s.data||[]) as any);setFields(f.data||[]);setInventory(Object.fromEntries((i.data||[]).map((v:any)=>[v.plan_subject_id,Number(v.published_count)||0])));
  setCohort(p=>p||localStorage.getItem('t360_cohort')||(c.data||[])[0]?.id||'');
  setField(p=>p||(f.data||[])[0]?.id||'');
 }
 async function refresh(){
  if(!db)return;
  const {data:{user:u}}=await db.auth.getUser();setUser(u);
  if(u){const {data:r}=await db.from('user_roles').select('role').eq('user_id',u.id).maybeSingle();setRole(r?.role||'');}
  else setRole('');
 }
 useEffect(()=>{void refresh();void reload().catch(e=>setError(why(e)));if(!db)return;const {data:{subscription}}=db.auth.onAuthStateChange(()=>{setTimeout(()=>void refresh(),0)});return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(cohort)localStorage.setItem('t360_cohort',cohort)},[cohort]);
 useEffect(()=>{if(session)localStorage.setItem('t360_active',JSON.stringify({attemptId:session.attemptId,subjectId:resultSubject,answers,current}))},[session,answers,current]);
 useEffect(()=>{if(session||tab==='result'||tab==='quiz')return;const s=localStorage.getItem('t360_active');if(!s)return;try{const a=JSON.parse(s);if(!user)return;void functionCall<Session>('quiz',{action:'resume',attemptId:a.attemptId}).then(x=>{setSession(x);setResultSubject(a.subjectId||'');setAnswers(a.answers||{});setCurrent(Math.min(a.current||0,x.questions.length-1));setTab('quiz')}).catch(()=>localStorage.removeItem('t360_active'))}catch{localStorage.removeItem('t360_active')}},[user]);
 async function guest(){if(!db)throw Error('لا يوجد اتصال');const {data:{session}}=await db.auth.getSession();if(session)return;const r=await db.auth.signInAnonymously();if(r.error)throw Error('فعّل الدخول المجهول Anonymous Sign-ins من Supabase Auth: '+r.error.message);await refresh();}

 async function begin(mode:'quick'|'remedial'='quick',sid?:string){
 const s=sid||chosen?.id;if(!s||!consentCheck())return;
 setBusy(true);setError('');
 try{await guest();const r=await functionCall<Session>('quiz',{action:'start',planSubjectId:s,mode});
 setSubject(s);setResultSubject(s);setSession(r);setAnswers({});setCurrent(0);setResult(null);setTab('quiz');window.scrollTo(0,0)}
 catch(e){setError(why(e))}finally{setBusy(false)}
 }
 async function submit(){if(!session)return;setBusy(true);setError('');try{
 const r=await functionCall<Result>('quiz',{action:'submit',attemptId:session.attemptId,answers});
 setResult(r);setSession(null);localStorage.removeItem('t360_active');setTab('result');window.scrollTo(0,0)
 }catch(e){setError(why(e))}finally{setBusy(false)}
 }

 async function login(e:React.FormEvent){e.preventDefault();if(!db)return;if(signup&&!consentCheck())return;setBusy(true);setError('');try{let r;
  if(signup&&user?.is_anonymous){const x=await db.auth.updateUser({email});if(x.error)throw x.error;setMessage('تم طلب ربط البريد بحساب الضيف. تحقّق من الرسالة أولاً، ثم عيّن كلمة المرور بعد تأكيد البريد.');return;}
  r=signup?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
  if(r.error)throw r.error;await refresh();setTab('home');setMessage(signup?'تحقق من البريد الإلكتروني إذا طُلب ذلك':'تم تسجيل الدخول');
 }catch(e){setError(why(e))}finally{setBusy(false)}}
 async function setLinkedPassword(){if(!db||!user)return;setBusy(true);setError('');try{if(password.length<8)throw Error('اختر كلمة مرور من ٨ أحرف على الأقل');const {error:e}=await db.auth.updateUser({password});if(e)throw e;setMessage('تم تعيين كلمة المرور. يمكن تسجيل الدخول بالحساب بعد تأكيد البريد.');setPassword('');await refresh();setTab('home')}catch(e){setError(why(e))}finally{setBusy(false)}}
 async function deleteMyAccount(){if(!db||!user||role)return;
  const confirmation=window.prompt('لحذف حسابك ونتائج اختباراتك نهائياً، اكتب: حذف');
  if(confirmation!=='حذف')return;
  setBusy(true);setError('');
  try{const r=await functionCall<{deleted:boolean}>('privacy',{action:'delete_my_account',confirm:'DELETE_MY_ACCOUNT'});
   if(!r.deleted)throw Error('تعذر حذف الحساب');
   await db.auth.signOut({scope:'local'});localStorage.removeItem('t360_active');localStorage.removeItem('t360_cloud_agreement');
   setConsent(false);setSession(null);setResult(null);setAnswers({});setHistory([]);setUser(null);setRole('');setMessage('تم حذف الحساب ونتائجك من الخادم');setTab('home');
  }catch(e){setError(why(e))}finally{setBusy(false)}
 }
 async function logout(){await db?.auth.signOut();setUser(null);setRole('');setTab('home');setMessage('تم تسجيل الخروج')}
 async function loadHistory(){if(!db||!user)return;setBusy(true);try{const {data,error:e}=await db.from('quiz_attempts').select('score,started_at,mode,plan_subject_id').eq('status','submitted').order('started_at',{ascending:false}).limit(40);if(e)throw e;setHistory(data||[]);setTab('history')}catch(e){setError(why(e))}finally{setBusy(false)}}
 async function loadAdmin(){setBusy(true);setError('');try{const x=await functionCall('admin',{action:'catalog'});setAdminData(x);setAdminSubjects(p=>p||x.planSubjects?.[0]?.id||'');setPlanId(p=>p||x.plans?.[0]?.id||'');setSubId(p=>p||x.subjects?.[0]?.id||'');setCohortId(p=>p||x.cohorts?.[0]?.id||'');setTab('admin')}catch(e){setError(why(e))}finally{setBusy(false)}}
 async function act(action:string,payload:Record<string,unknown>={}){setBusy(true);setError('');try{await functionCall('admin',{action,...payload});setMessage('تم حفظ العملية بنجاح');await loadAdmin();await reload();if(adminSubjects)await listQuestions()}catch(e){setError(why(e))}finally{setBusy(false)}}
 async function listQuestions(){if(!adminSubjects)return;try{const d=await functionCall<{questions:any[]}>('admin',{action:'list_questions',planSubjectId:adminSubjects});setQuestionRows(d.questions||[])}catch(e){setError(why(e))}}

 async function readExcel(file:File){
  setError('');setImports([]);
  try{
   if(file.size>5*1024*1024)throw Error('حجم الملف أكبر من 5 MB');
   const matrix=await readSheet(file);
   if(!matrix.length||matrix.length>2001)throw Error('ملف Excel يجب أن يحتوي على عناوين الأعمدة و1 إلى 2000 سؤال');
   const header=matrix[0].map(cell=>String(cell??'').trim());
   const required=['question','A','B','C','D','correct','explanation','exam_year','exam_session','question_number','source_reference','difficulty'];
   if(required.some(col=>!header.includes(col)))throw Error('أعمدة ناقصة: '+required.filter(col=>!header.includes(col)).join('، '));
   const records=matrix.slice(1).filter(line=>line.some(v=>v!==null&&String(v??'').trim()!=='')).map(line=>Object.fromEntries(header.map((key,i)=>[key,String(line[i]??'').trim()]))).map((r:any)=>({
    question:r.question,A:r.A,B:r.B,C:r.C,D:r.D,correct:String(r.correct).toUpperCase(),explanation:r.explanation,
    exam_year:String(r.exam_year),exam_session:r.exam_session,question_number:r.question_number,
    source_reference:r.source_reference,rights_note:r.rights_note||'',difficulty:Number(r.difficulty),topic:r.topic||'عام'
   }));
   if(!records.length||records.length>2000)throw Error('يجب أن يكون الملف من 1 إلى 2000 سؤال');
   const bad=records.findIndex((r:any)=>r.question.length<10||r.explanation.length<5
    ||!r.A||!r.B||!r.C||!r.D||!['A','B','C','D'].includes(r.correct)||![1,2,3].includes(r.difficulty)
    ||!/^\d{4}$/.test(r.exam_year)||Number(r.exam_year)<1950||!r.exam_session||!r.question_number||!String(r.source_reference).startsWith('https://'));
   if(bad>=0)throw Error('تحقق من بيانات السؤال في صف Excel رقم '+(bad+2)+'، لا يُسمح بالأسئلة غير الموثقة');
   setImports(records);setMessage('جاهز لاستيراد '+records.length+' سؤال وزاري كمسودة، ولن يظهر للطلاب إلا بعد المراجعة والنشر');
  }catch(e){setError(why(e))}
 }

 async function importExcel(){setBusy(true);setError('');try{let imported=0;for(let i=0;i<imports.length;i+=50){const r=await functionCall<{imported:number}>('admin',{action:'import_questions',planSubjectId:adminSubjects,questions:imports.slice(i,i+50)});imported+=r.imported}setImports([]);setMessage('تم استيراد '+imported+' سؤال وزاري كمسودات بانتظار مراجعة المصادر والإجابات');await listQuestions()}catch(e){setError(why(e))}finally{setBusy(false)}}
 if(!db)return <main className="wrap"><h1>توجيهي 360</h1><div className="alert error">لم يتم إعداد VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY</div></main>;
 return <div dir="rtl"><div className="ribbon">توجيهي 360 • منصة تدريب مستقلة • الأسئلة الوزارية تتطلب توثيق المصدر واعتماد المعلم</div>
 <header className="header"><div className="headerin"><div className="brand">توجيهي <b>360</b><small>مش بس تعرف علامتك، تعرف كيف ترفعها.</small></div><nav className="nav"><button className={tab==='home'?'active':''} onClick={()=>setTab('home')}>الرئيسية</button><button onClick={()=>void loadHistory()}>نتائجي</button>{role&&<button onClick={()=>void loadAdmin()}>لوحة الإدارة</button>}{user?<button onClick={()=>void logout()}>{user.email?'خروج':'ضيف • خروج'}</button>:<button onClick={()=>setTab('login')}>تسجيل الدخول</button>}<button onClick={()=>setTab('privacy')}>الخصوصية</button></nav></div></header>
 <main className="wrap">{error&&<div role="alert" className="alert error">{error}</div>}{message&&<div className="alert success">{message}<button className="btn" style={{float:'left'}} onClick={()=>setMessage('')}>×</button></div>}
 
 {tab==='home'&&<>
 <div className="hero">
  <span className="pill">التدريب على أسئلة امتحانات وزارية موثقة</span>
  <h1>توجيهي 360<br/> مش بس تعرف علامتك، تعرف كيف ترفعها.</h1>
  <p>تدرّب على الأسئلة الوزارية بعد توثيق المصدر ومراجعتها ونشرها. لا تتضمن المنصة أسئلة تجريبية أو مولّدة أو منسوبة خطأً إلى الوزارة.</p>
  <button className="btn" onClick={()=>document.getElementById('choose')?.scrollIntoView({behavior:'smooth'})}>اختر مبحثك ←</button>
 </div>
 <section className="panel" id="choose"><h2>اختر الجيل والسنة والمبحث الوزاري</h2>
 <div className="alert">تبدأ الاختبارات عندما يُنشر للمبحث 5 أسئلة وزارية موثقة على الأقل. حتى ذلك الحين ستظهر المواد بعبارة «بانتظار إضافة الأسئلة الوزارية».</div>
 <div className="form"><label>الجيل<select value={cohort} onChange={e=>setCohort(e.target.value)}>{cohorts.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label>
 <label>السنة<select value={grade} onChange={e=>setGrade(Number(e.target.value))}><option value={11}>الأولى — الحادي عشر</option><option value={12}>الثانية — الثاني عشر</option></select></label>
 {grade===12&&<label>الحقل<select value={field} onChange={e=>setField(e.target.value)}>{fields.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>}</div>
 <div className="row" style={{justifyContent:'flex-start',margin:'17px 0'}}>
 <label className="row"><input type="checkbox" style={{width:18,height:18}} checked={consent}
 onChange={e=>{setConsent(e.target.checked);setConsentError('');if(e.target.checked)localStorage.setItem('t360_cloud_agreement','yes');else localStorage.removeItem('t360_cloud_agreement')}}/>
 أوافق على حفظ محاولاتي ونتائجي للتصحيح وتخصيص التدريب. <button className="btn" style={{padding:'5px 8px'}} onClick={()=>setTab('privacy')}>الخصوصية</button></label>
 </div>{consentError&&<div className="alert error" role="alert">{consentError}</div>}
 <div className="grid">{visible.map(s=><div key={s.id} className="card">
 <span className="section-label">مبحث وزاري</span><h3>{s.subjects.name_ar}</h3>
 <p>{(inventory[s.id]||0)>0?('أسئلة وزارية منشورة: '+inventory[s.id]):'بانتظار إضافة الأسئلة الوزارية'}</p>
 <button className="btn primary" style={{marginTop:14}} disabled={busy||(inventory[s.id]||0)<5}
 onClick={()=>void begin('quick',s.id)}>{(inventory[s.id]||0)<5?'غير متاح بعد':'ابدأ اختباراً وزارياً ←'}</button>
 </div>)}</div>
 {!visible.length&&<div className="alert">لا توجد مباحث وزارية مرتبطة بهذا الجيل والسنة حتى الآن.</div>}
 </section>
 <div className="grid"><div className="panel"><h2>تدريب على الأخطاء</h2><p className="muted">بعد حل الأسئلة الوزارية، يقدّم لك النظام تمارين إضافية من البنك الوزاري المنشور مع إعطاء الأولوية لأخطائك.</p></div>
 <div className="panel"><h2>تصحيح وتفسير</h2><p className="muted">تُصحّح الإجابات على الخادم، ثم تظهر النتيجة والتفسير والمصدر الوزاري للأسئلة المتاحة.</p></div></div>
 </>}

{tab==='quiz'&&session&&<section className="panel"><div className="row-between"><span className="section-label">{'أسئلة امتحانات وزارية — '+(session.mode==='remedial'?'مراجعة الأخطاء':'اختبار سريع')}</span><strong>{current+1} / {session.questions.length}</strong></div><div className="progress"><div style={{width:(100*(current+1)/session.questions.length)+'%'}}/></div><h2 className="question">{session.questions[current].question}</h2>{Object.entries(session.questions[current].options).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=><button key={k} className={'choice '+(answers[session.questions[current].id]===k?'selected':'')} onClick={()=>setAnswers(p=>({...p,[session.questions[current].id]:k}))}><strong>{chars[k]||k}</strong>{v}</button>)}<div className="row-between" style={{marginTop:20}}><button className="btn" disabled={current===0} onClick={()=>setCurrent(v=>v-1)}>السابق</button>{current+1<session.questions.length?<button className="btn primary" onClick={()=>setCurrent(v=>v+1)}>التالي ←</button>:<button disabled={busy} className="btn green" onClick={()=>void submit()}>تسليم وتصحيح الاختبار</button>}</div></section>}
 {tab==='result'&&result&&<><section className="panel"><span className="section-label">نتيجتك — ماذا تعلمت؟</span><h2>العلامة ليست النهاية؛ بل بداية خطة التحسين</h2><div className="grid"><div className="metric"><b>{result.score}%</b><small>علامتك</small></div><div className="metric"><b>{result.correctCount}</b><small>إجابات صحيحة</small></div><div className="metric"><b>{result.total-result.correctCount}</b><small>تحتاج مراجعة</small></div></div><div className="row" style={{marginTop:18}}><button disabled={busy} className="btn primary" onClick={()=>void begin('remedial',resultSubject)}>اختبرني في أخطائي</button><button className="btn" onClick={()=>setTab('home')}>الصفحة الرئيسية</button></div></section><section className="panel"><h2>مراجعة الإجابات</h2>{result.review.map((r,i)=><div className={'review '+(!r.isCorrect?'wrong':'')} key={r.id}><strong>{i+1}. {r.question}</strong><p>إجابتك: {r.selected?r.options[r.selected]:'بدون إجابة'}</p><p>الصحيحة: <b>{r.options[r.correctAnswer]}</b></p><p className="muted">{r.explanation}</p></div>)}</section></>}
 {tab==='history'&&<section className="panel"><h2>سجل محاولاتك</h2>{!user?<div className="alert">ابدأ اختباراً أولاً ليظهر سجل نتائجك.</div>:history.length?<div className="grid">{history.map((r,i)=><div key={i} className="metric"><b>{r.score}%</b><small>{r.mode==='remedial'?'مراجعة الأخطاء':'أسئلة وزارية'} • {new Date(r.started_at).toLocaleDateString('ar-JO')}</small></div>)}</div>:<p>لم تكمل أي اختبار بعد.</p>}</section>}
 {tab==='privacy'&&<section className="panel" style={{maxWidth:850,margin:'16px auto'}}>
 <span className="section-label">سياسة خصوصية • نسخة تجريبية عامة</span><h2>الخصوصية واستخدام بياناتك</h2>
 <p>«توجيهي 360» منصة تدريب مستقلة ولا تتبع وزارة التربية والتعليم. لا تُنشر فيها إلا أسئلة امتحانات وزارية يتم التحقق من مصدرها وسنة انعقادها والإذن بإعادة استخدامها. ولا تنسب المنصة أسئلة تدريبية مؤلفة إلى الوزارة.</p>
 <h3>ماذا نخزن؟</h3><p>عند اختيار التدريب السحابي يتم إنشاء معرّف حساب ضيف، ونخزن سجل المحاولات والوقت والإجابات والنتيجة لتصحيح الاختبار واقتراح مراجعة الأخطاء. إذا أنشأت حساباً دائماً، نخزن بريدك الإلكتروني وبيانات المصادقة اللازمة له. لا نطلب الاسم الحقيقي أو الرقم الوطني أو اسم المدرسة.</p>
 <h3>أين تُحفظ المعلومات؟</h3><p>البيانات السحابية محفوظة لدى Supabase، وتُستضاف قاعدة البيانات الحالية خارج الأردن (منطقة أستراليا). وتُستخدم Vercel لعرض الموقع. قد تسجل خدمات الاستضافة معلومات تقنية أساسية لتشغيل الخدمة والحماية.</p>
 <h3>الاختبار المحلي</h3><p>يمكن استخدام التدريب الوزاري بحساب ضيف دون بريد إلكتروني؛ وتُحفظ المحاولات على الخادم حتى تستطيع مراجعة أخطائك. إذا حذفت الحساب فلن تتمكن من استعادة سجله.</p>
 <h3>كيف تتحكم في البيانات؟</h3><p>إذا دخلت بحساب ضيف أو طالب، يمكنك حذف الحساب والنتائج المرتبطة به من الزر أدناه. الحذف نهائي. إذا كنت قاصراً، استشر ولي أمرك قبل استخدام بريد إلكتروني لإنشاء حساب دائم.</p>
 <div className="row">{user&&!role&&<button className="btn" style={{color:'#a12a27',borderColor:'#c98382'}} disabled={busy} onClick={()=>void deleteMyAccount()}>حذف حسابي السحابي وجميع نتائجي</button>}</div>
 <p className="small muted">هذه السياسة توضّح الاستخدام البرمجي الحالي. قبل التوسع التجاري يجب تعيين جهة التحكم بالبيانات وبيانات الاتصال الرسمية، واستكمال مراجعة المتطلبات القانونية الأردنية الخاصة بالقاصرين.</p>
 <button className="btn primary" onClick={()=>setTab('home')}>عودة للرئيسية</button>
 </section>}
 {tab==='login'&&<section className="panel" style={{maxWidth:500,margin:'20px auto'}}><h2>{signup?'إنشاء حساب طالب':'دخول المستخدمين والمدير'}</h2><form onSubmit={e=>void login(e)}><label>البريد الإلكتروني<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><br/><label>كلمة المرور<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label><br/><button className="btn primary" disabled={busy}>إرسال</button></form><button className="btn" onClick={()=>setSignup(x=>!x)}>{signup?'لديك حساب؟ تسجيل الدخول':'إنشاء حساب جديد'}</button>{signup&&<label className="row" style={{marginTop:15}}><input type="checkbox" style={{width:18,height:18}} checked={consent} onChange={e=>{setConsent(e.target.checked);if(e.target.checked)localStorage.setItem('t360_cloud_agreement','yes');else localStorage.removeItem('t360_cloud_agreement')}}/> أوافق على حفظ نتائج الاختبارات وربطها بحساب البريد.</label>}{user?.is_anonymous&&<div className="alert">تستخدم حساب ضيف. للحفاظ على محاولاتك: اربط البريد، ثم أكّد الرسالة، وبعد ذلك اختر كلمة مرور. لا تسجّل الخروج أثناء الانتقال.</div>}{user?.email&&<div className="alert"><strong>ربط حساب الضيف أو تعيين كلمة مرور</strong><p>بعد تأكيد بريدك الإلكتروني، أدخل كلمة المرور الجديدة في الحقل أعلاه واضغط هنا:</p><button disabled={busy} className="btn secondary" type="button" onClick={()=>void setLinkedPassword()}>تعيين كلمة المرور لهذا الحساب</button></div>}</section>}
 {tab==='admin'&&adminData&&<><section className="panel"><div className="row-between"><div><span className="section-label">إدارة محتوى التوجيهي</span><h2>لوحة الإدارة — {role}</h2></div><button className="btn" onClick={()=>void loadAdmin()}>تحديث</button></div><div className="grid"><div className="metric"><b>{adminData.plans.length}</b><small>خطط</small></div><div className="metric"><b>{adminData.planSubjects.length}</b><small>مباحث</small></div><div className="metric"><b>{adminData.cohorts.length}</b><small>أجيال</small></div></div></section>
 {role==='admin'&&<section className="panel"><h2>إدارة الخطط والأجيال</h2><div className="split"><div><label>اسم خطة جديدة<input value={planName} onChange={e=>setPlanName(e.target.value)}/></label><label>السنة الدراسية<input value={academicYear} onChange={e=>setAcademicYear(e.target.value)}/></label><button className="btn" disabled={busy} onClick={()=>void act('create_plan',{name:planName,academicYear,source:ref})}>إضافة خطة مسودة</button></div><div><label>اسم الجيل<input value={label} onChange={e=>setLabel(e.target.value)}/></label><button className="btn" disabled={busy} onClick={()=>void act('add_cohort',{label})}>إضافة جيل</button></div></div><label>مرجع رسمي (HTTPS)<input value={ref} onChange={e=>setRef(e.target.value)}/></label><h3>الخطط</h3>{adminData.plans.map((p:any)=><div key={p.id} className="row-between review"><span>{p.name} — {p.verification_status}</span>{p.verification_status==='draft'&&<button className="btn" disabled={busy} onClick={()=>void act('verify_plan',{planId:p.id,source:ref})}>اعتماد بعد التحقق</button>}</div>)}
 <h3>ربط المواد والخطط</h3><div className="form"><label>الخطة<select value={planId} onChange={e=>setPlanId(e.target.value)}>{adminData.plans.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>المادة<select value={subId} onChange={e=>setSubId(e.target.value)}>{adminData.subjects.map((x:any)=><option key={x.id} value={x.id}>{x.name_ar}</option>)}</select></label><label>السنة<select value={adminGrade} onChange={e=>setAdminGrade(Number(e.target.value))}><option value={11}>11</option><option value={12}>12</option></select></label><label>الحقل<select value={fieldId} onChange={e=>setFieldId(e.target.value)}><option value="">مشترك</option>{adminData.fields.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><button className="btn" disabled={busy} onClick={()=>void act('add_plan_subject',{planId,subjectId:subId,grade:adminGrade,fieldId,source:ref})}>إضافة مبحث مسودة</button></div><h3>التحقق من المباحث</h3>{adminData.planSubjects.map((x:any)=><div className="row-between review" key={x.id}><span>{x.subjects?.name_ar} — {x.curriculum_plans?.name} — {x.verification_status}</span>{x.verification_status==='draft'&&<button className="btn" disabled={busy} onClick={()=>void act('verify_subject',{planSubjectId:x.id,source:ref})}>اعتماد المادة</button>}</div>)}
 <h3>ربط الجيل بالمنهاج</h3><div className="form"><label>الجيل<select value={cohortId} onChange={e=>setCohortId(e.target.value)}>{adminData.cohorts.map((c:any)=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label>الدورة<input value={examSession} onChange={e=>setExamSession(e.target.value)}/></label><button className="btn" disabled={busy} onClick={()=>void act('add_assignment',{cohortId,planId,grade:adminGrade,examSession,verified:true})}>اعتماد الربط بعد التحقق</button></div></section>}
 <section className="panel"><h2>استيراد أسئلة Excel ومراجعتها</h2><label>اختر المبحث<select value={adminSubjects} onChange={e=>{setAdminSubjects(e.target.value);setQuestionRows([])}}>{adminData.planSubjects.map((s:any)=><option key={s.id} value={s.id}>{s.subjects?.name_ar} • {s.curriculum_plans?.name} • {s.grade_level}</option>)}</select></label><div className="row" style={{marginTop:15}}><button className="btn" onClick={()=>void listQuestions()}>عرض أحدث الأسئلة</button>{['admin','teacher'].includes(role)&&<label className="btn">اختيار ملف XLSX<input style={{display:'none'}} type="file" accept=".xlsx" onChange={e=>{if(e.target.files?.[0])void readExcel(e.target.files[0])}}/></label>}{imports.length>0&&<button className="btn green" disabled={busy} onClick={()=>void importExcel()}>استيراد {imports.length} سؤالاً كمسودة</button>}</div><p className="small muted">أعمدة Excel: question, A, B, C, D, correct, explanation, difficulty, topic, source_type, source_reference. لا توجد إجابات منشورة قبل المراجعة.</p>{questionRows.map(q=><div key={q.id} className="row-between review"><div><b>{q.question}</b><p className="muted">{q.status} • {q.topic}</p></div><div className="row">{q.status==='draft'&&['admin','reviewer'].includes(role)&&<button className="btn" disabled={busy} onClick={()=>void act('set_question_status',{questionId:q.id,status:'review'})}>إرسال للمراجعة</button>}{q.status==='review'&&['admin','reviewer'].includes(role)&&<button className="btn green" disabled={busy} onClick={()=>void act('set_question_status',{questionId:q.id,status:'published'})}>اعتماد النشر</button>}{(q.status==='published'||q.status==='pilot')&&['admin','reviewer'].includes(role)&&<button className="btn" disabled={busy} onClick={()=>void act('set_question_status',{questionId:q.id,status:'archived'})}>أرشفة</button>}</div></div>)}</section></>}
 </main><footer className="footer">توجيهي 360 — منصة مستقلة • فقط الأسئلة الوزارية التي تم التحقق منها <button className="btn" style={{marginRight:8,padding:'5px 12px'}} onClick={()=>setTab('privacy')}>الخصوصية</button></footer></div>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
