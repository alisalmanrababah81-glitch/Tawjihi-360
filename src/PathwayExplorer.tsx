import React,{useState} from 'react';

export type Pathway={
 id:string;cohort_label:string;academic_year:string;grade_level:number;field_code:string;field_name:string;
 fixed_subject_codes:string[];optional_subject_codes:string[];
 status:'year_verified'|'previous_year_reference'|'awaiting_future_rules';
 source_url:string;secondary_reference_url?:string|null;editorial_note:string;
};
export type AvailableSubject={id:string;grade_level:number;field_id:string|null;curriculum_plan_id:string;subjects:{name_ar:string;code:string}};
export type Field={id:string;name:string};
export type Cohort={id:string;label:string};
type Props={
 pathways:Pathway[];cohorts:Cohort[];cohortId:string;changeCohort:(id:string)=>void;
 grade:number;changeGrade:(grade:number)=>void;fields:Field[];fieldId:string;changeField:(id:string)=>void;
 available:AvailableSubject[];inventory:Record<string,number>;busy:boolean;
 consent:boolean;changeConsent:(value:boolean)=>void;consentError:string;
 openPrivacy:()=>void;startQuiz:(subjectId:string)=>void;
};
const subjects:Record<string,string>={
 arabic:'اللغة العربية',math:'الرياضيات',islamic:'التربية الإسلامية',history:'تاريخ الأردن',
 english:'اللغة الإنجليزية',chemistry:'الكيمياء',biology:'العلوم الحياتية',advanced_english:'اللغة الإنجليزية المتقدمة',
 physics:'الفيزياء',earth_science:'علوم الأرض والبيئة',specialized_arabic:'اللغة العربية / تخصص',
 specialized_islamic:'التربية الإسلامية / تخصص',general_history:'التاريخ',geography:'الجغرافيا',
 sociology_psychology:'علم الاجتماع وعلم النفس',financial_culture:'الثقافة المالية',
 philosophy:'الفلسفة',business_math:'رياضيات الأعمال'
};
const fieldIcon:Record<string,string>={health:'✚',stem:'⌘',humanities:'✦',business:'◈'};
const fieldShort:Record<string,string>={health:'الصحي',stem:'العلوم والتكنولوجيا والهندسة',humanities:'اللغات والعلوم الإنسانية والاجتماعية',business:'الأعمال'};
export default function PathwayExplorer({
 pathways,cohorts,cohortId,changeCohort,grade,changeGrade,fields,fieldId,changeField,
 available,inventory,busy,consent,changeConsent,consentError,openPrivacy,startQuiz
}:Props){
 const [optionalChoices,setOptionalChoices]=useState<Record<string,string>>({});
 const chosenCohort=cohorts.find(c=>c.id===cohortId)?.label||'جيل 2010';
 const possible=pathways.filter(p=>p.cohort_label===chosenCohort&&p.grade_level===grade);
 const allFields=possible.filter(p=>p.field_code!=='general');
 const selectedField=fields.find(f=>f.id===fieldId)?.name;
 const current=grade===11?possible.find(p=>p.field_code==='general'):
  allFields.find(p=>p.field_name===selectedField)||allFields[0];
 const changingField=(p:Pathway)=>{const f=fields.find(f=>f.name===p.field_name);if(f)changeField(f.id)};
 const activeOptional= current?optionalChoices[current.id]||'':'';
 const rows=current?[...current.fixed_subject_codes,...(activeOptional?[activeOptional]:[])]:[];
 const cohortChange=(id:string)=>{changeCohort(id);changeGrade(cohorts.find(c=>c.id===id)?.label==='جيل 2009'?12:11)};
 const card=(code:string,kind:'fixed'|'optional')=>{
  const s=available.find(item=>item.subjects?.code===code);
  const count=s?inventory[s.id]||0:0;
  const enabled=!!s&&count>=5&&current?.status!=='awaiting_future_rules';
  return <div key={code} className="course-card">
   <div className="course-top"><span className="course-symbol">{code==='math'||code==='business_math'?'∑':code==='chemistry'?'⚗':code==='biology'?'⌁':code.includes('english')?'EN':code.includes('arabic')?'ع':'◉'}</span>
   <span className={'course-tag '+(kind==='optional'?'course-tag-opt':'')}>{kind==='fixed'?'وزاري ثابت':'وزاري اختياري'}</span></div>
   <strong>{subjects[code]||code}</strong>
   <p>{count?count+' سؤالاً وزارياً منشوراً':'بنك الأسئلة قيد التوثيق'}</p>
   <button className="btn course-start" disabled={!enabled||busy}
   onClick={()=>{if(s)startQuiz(s.id)}}>{enabled?'ابدأ التدريب ←':'بانتظار الأسئلة الوزارية'}</button>
  </div>;
 };
 return <>
  <div className="t360-hero">
   <div className="t360-hero-content">
    <span className="t360-eyebrow"><span className="dot-live"/> الأردن • المسار الأكاديمي • 2026/2027</span>
    <h1>اعرف طريقك.<br/><span>تدرّب على الوزاري.</span><br/>وارفع علامتك.</h1>
    <p>توجيهي 360 — منصة لا تكتفي بعرض العلامة، بل ترشدك إلى المواد الوزارية الصحيحة حسب جيلك وحقلك، ثم تعيد تدريبك على أخطائك من أسئلة موثّقة فقط.</p>
    <button className="btn t360-action" onClick={()=>document.getElementById('choose')?.scrollIntoView({behavior:'smooth'})}>استكشف مباحثك <span aria-hidden="true">↙</span></button>
    <p className="hero-foot">بلا أسئلة تجريبية أو مولّدة • لا تُرسل الإجابات الصحيحة قبل التصحيح</p>
   </div>
   <div className="hero-art" aria-hidden="true">
    <div className="art-orbit art-orbit-a"/><div className="art-orbit art-orbit-b"/>
    <div className="art-center"><span>360°</span><strong>خريطة النجاح</strong><small>من اختيار المبحث<br/>إلى تصحيح الخطأ</small></div>
    <div className="art-stamp stamp-a">01 <span>جيلك</span></div>
    <div className="art-stamp stamp-b">02 <span>مباحثك</span></div>
    <div className="art-stamp stamp-c">03 <span>أخطاؤك</span></div>
   </div>
  </div>
  <section className="explorer-shell" id="choose" aria-label="استكشاف مواد التوجيهي">
   <div className="explorer-head"><div><span className="eyebrow-dark">الخطوة الأولى — مسارك</span><h2>كل جيل له خطة. وكل حقل له مواد.</h2><p>حدّد جيلك وسنتك الدراسية لتظهر المواد التي تهمك فقط.</p></div><span className="path-year">2026 / 2027</span></div>
   <div className="path-step"><span className="step-number">01</span><h3>اختر الجيل</h3></div>
   <div className="path-switch cohort-switch">
    {cohorts.map(c=><button key={c.id} className={cohortId===c.id?'selected':''} onClick={()=>cohortChange(c.id)}>
    <span className="option-kicker">{c.label==='جيل 2009'?'السنة الثانية حالياً':'السنة الأولى حالياً'}</span><strong>{c.label}</strong></button>)}
   </div>
   <div className="path-step"><span className="step-number">02</span><h3>اختر السنة الدراسية</h3></div>
   <div className="path-switch grade-switch">
    <button className={grade===11?'selected':''} onClick={()=>changeGrade(11)}><strong>الصف الحادي عشر</strong><span>الجزء الأول • 30%</span></button>
    <button className={grade===12?'selected':''} onClick={()=>changeGrade(12)}><strong>الصف الثاني عشر</strong><span>الجزء الثاني • 70%</span></button>
   </div>
   {grade===12&&<><div className="path-step"><span className="step-number">03</span><h3>اختر الحقل</h3></div>
    <div className="field-tiles">{allFields.map(p=><button key={p.id} className={'field-tile '+(current?.id===p.id?'active':'')} onClick={()=>changingField(p)}>
    <span className="field-glyph">{fieldIcon[p.field_code]||'✦'}</span><strong>{fieldShort[p.field_code]||p.field_name}</strong>
    <span>3 ثابتة + مادة اختيارية</span></button>)}</div></>}
   {current?<div className="course-content">
    <div className="course-heading">
     <div><span className="eyebrow-dark">خريطتك الوزارية</span><h3>{current.field_name}</h3><p>{chosenCohort} • الصف {grade===11?'الحادي عشر':'الثاني عشر'} • {current.academic_year}</p></div>
     <span className={'status-text '+(current.status==='awaiting_future_rules'?'status-future':'')}>{current.status==='awaiting_future_rules'?'قائمة إرشادية — بانتظار أسس 2027/2028':current.status==='previous_year_reference'?'مرجع السنة الماضية':'حسب أسس سنة '+current.academic_year}</span>
    </div>
    {current.status==='awaiting_future_rules'&&<div className="caution-line"><strong>تنبيه للجيل 2010:</strong> تفاصيل مواد الثاني عشر لعام 2027/2028 لم تُعتمد بعد. هذه المواد للإرشاد من خطة 2026/2027 الخاصة بجيل 2009 فقط، ولن نتيح التدريب بناء عليها قبل تأكيد الوزارة.</div>}
    {current.status==='previous_year_reference'&&<div className="caution-line">مواد الحادي عشر التي تقدم لها جيل 2009 سابقاً، وليست خطة الحادي عشر للجيل 2010.</div>}
    <div className="course-label"><span className="step-number tiny">✓</span> المباحث الوزارية الثابتة — {current.fixed_subject_codes.length}</div>
    <div className="course-grid">{current.fixed_subject_codes.map(code=>card(code,'fixed'))}</div>
    {current.optional_subject_codes.length>0&&<>
      <div className="course-label" style={{marginTop:23}}><span className="step-number tiny">+</span> المبحث الاختياري — اختر واحداً من القائمة</div>
      <div className="optional-grid">{current.optional_subject_codes.map(code=><button key={code} className={activeOptional===code?'chosen':''} onClick={()=>setOptionalChoices(v=>({...v,[current.id]:code}))}><span>{activeOptional===code?'✓':'○'}</span> {subjects[code]||code}</button>)}</div>
      {activeOptional&&<div className="course-grid optional-picked">{card(activeOptional,'optional')}</div>}
      {!activeOptional&&<p className="hint-line">اختر مادة واحدة لعرض بطاقة التدريب الخاصة بها؛ لا تُحتسب جميع الاختيارات معاً.</p>}
    </>}
    <div className="course-consent">
     <label><input type="checkbox" checked={consent} onChange={e=>changeConsent(e.target.checked)}/> أوافق على حفظ محاولات التدريب ونتائجي من أجل تصحيح أخطائي.</label>
     <button onClick={openPrivacy}>اقرأ سياسة الخصوصية ↗</button>
    </div>{consentError&&<p className="alert error" role="alert">{consentError}</p>}
    <div className="source-note"><span>◈</span><div><strong>مصدر الخطة ودرجة توثيقها</strong>
    <p>{current.editorial_note} لا تُنشر الأسئلة حتى التحقق من نص الورقة الوزارية وحقوق إعادة استخدامها.</p>
    <a href={current.source_url} target="_blank" rel="noopener noreferrer">بوابة الوزارة المرجعية ↗</a></div></div>
   </div>:<div className="alert">لا تتوفر بيانات لهذا المسار بعد، ولا نقدم قائمة غير مؤكدة.</div>}
  </section>
  <section className="t360-difference"><div className="difference-intro"><span className="eyebrow-dark">ما الذي يميز توجيهي 360؟</span><h2>المهم ليس كم سؤالاً تحلّ.<br/> المهم أي خطأ تتجاوز.</h2></div>
   <div className="diff-grid">
    <div><span className="diff-icon">◎</span><h3>بصمة خطئك</h3><p>التصحيح يحدد الأسئلة التي أخطأت بها؛ والتدريب التالي يعطيها أولوية بدل تكرار أسئلة عشوائية.</p></div>
    <div><span className="diff-icon">↗</span><h3>أثر المصدر</h3><p>كل سؤال منشور يمر بمراجعة سنة الامتحان والدورة ورقم السؤال ومصدره، دون خلط أوراق المنهاج القديم بالجديد.</p></div>
    <div><span className="diff-icon">◌</span><h3>هدوء قبل الامتحان</h3><p>مسار سريع بلا فيديوهات طويلة ولا تصفح مشتت: اختر المبحث، أجب، افهم، ثم أعد التدريب.</p></div>
   </div>
  </section>
 </>;
}
