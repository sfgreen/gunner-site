// Study article: the next best step for 26 ED presentations, written for the
// Step 2 CK student who searches "what do I do first" for a chief complaint.
// Every step, dose and threshold here restates the audited ED pathways in the
// gunner repo (content_staging/pathways/*.json), which cite the guideline text
// for each one; where the sources disagree, the article says so. Danny signs
// off the medicine before this ships.
// No em or en dashes anywhere in the copy (site rule).
import { Fragment } from 'react';
import type { GetStaticProps } from 'next';
import Link from 'next/link';
import LabLayout from '../components/LabLayout';
import { appStoreUrl, track, referrerHost } from '../lib/analytics';
import { publishedEntries } from '../lib/pathways/data';

const CAMPAIGN = 'article_ed_next_best_step';
const PUBLISHED = '2026-10-22';
const PATH = '/step-2-ck-emergency-medicine';

type Presentation = {
  id: string;
  /** The /pathways/<slug> article this card condenses. */
  pathway: string;
  name: string;
  first: string;
  steps: string[];
  trap: string;
  sources: string;
};

type Group = { title: string; items: Presentation[] };

const GROUPS: Group[] = [
  {
    title: 'Chest, heart and circulation',
    items: [
      {
        id: 'chest-pain',
        pathway: 'chest-pain',
        name: 'Chest pain',
        first: 'A 12-lead ECG within 10 minutes of first contact, with the pressure in both arms. Everything after it forks on that tracing.',
        steps: [
          'Inferior ST elevation: right-sided leads (V4R) before any nitroglycerin.',
          'STEMI with PCI reachable in time: primary PCI, first contact to device within 90 minutes, or 120 with a transfer. PCI more than 120 minutes away: fibrinolysis now, then transfer.',
          'No ST elevation: high-sensitivity troponin now and again at 1 to 2 hours. NSTEMI: heparin 60 IU/kg bolus (max 4,000), then 12 IU/kg/h (max 1,000).',
          'Both troponins below the 99th percentile: score HEART. 3 or less: home without urgent cardiac testing. 4 to 6: intermediate, further testing. 7 or more: high risk despite the negative troponins, so invasive coronary angiography.',
          'Aortic features (abrupt severe chest or back pain with a pulse deficit or an arm pressure gap): CT angiography of the chest, abdomen and pelvis; an IV beta blocker is the first drug.',
        ],
        trap: 'A prior stroke or TIA rules out prasugrel as the P2Y12 load.',
        sources: 'ACC/AHA ACS 2025, ACC/AHA chest pain 2021, ACC/AHA aortic 2022, HEART score guide 2018',
      },
      {
        id: 'palpitations',
        pathway: 'palpitations',
        name: 'Palpitations and arrhythmia',
        first: 'Monitor, vitals and a 12-lead ECG. A tachyarrhythmia causing shock or ischemia gets synchronized cardioversion now.',
        steps: [
          'Stable, regular, narrow: modified Valsalva (strain, then lie flat with the legs raised), then adenosine 6 mg rapid push with a flush, then 12 mg, then IV diltiazem, verapamil or a beta blocker.',
          'Fast AF or flutter: look for a driver first (sepsis, bleeding, PE). EF over 40%: IV diltiazem or a beta blocker. EF 40% or less: a beta blocker or digoxin, no IV diltiazem or verapamil.',
          'AF for over 48 hours or of unknown duration: rate control, then 3 weeks of anticoagulation or a TEE before cardioversion.',
          'Stable wide-complex tachycardia of uncertain mechanism: treat it as VT. Torsades: magnesium sulfate 2 g IV, stop QT drugs, replace potassium.',
        ],
        trap: 'Pre-excited AF gets IV procainamide or ibutilide. Any AV nodal blocker is the wrong answer.',
        sources: 'ACC/AHA AF 2023, ESC SVT 2019, ESC VA 2022, FDA adenosine, diltiazem and verapamil labels',
      },
      {
        id: 'syncope',
        pathway: 'syncope',
        name: 'Syncope',
        first: 'Monitor, vitals, a 12-lead ECG, glucose if it could be low, and the witness account.',
        steps: [
          'Bradycardia with shock: IV atropine, then pacing if rate and pressure do not respond. High-grade AV block once stable: look for a reversible cause, then a permanent pacemaker.',
          'Long QT, a Brugada pattern or pre-excitation: cardiac monitoring and cardiology assessment within 24 hours.',
          'Exertional syncope, a murmur, heart failure or a family history of sudden death under 40: echo and monitoring. Severe aortic stenosis: valve replacement. HCM with a gradient: beta blocker, no vasodilators or diuretics.',
          'Uncomplicated faint, normal ECG, no red flags: home with reassurance, salt and fluids, and counter-pressure maneuvers.',
        ],
        trap: 'Syncope on exertion is never filed as a simple faint until the echo is back.',
        sources: 'NICE CG109, ESC pacing 2021, HRS 2015, Canadian Syncope Risk Score 2016',
      },
      {
        id: 'hypertension',
        pathway: 'hypertensive-emergency',
        name: 'Severely raised blood pressure',
        first: 'Pressures in both arms, then a screen for organ damage and pregnancy. The number alone never earns IV treatment.',
        steps: [
          'No acute organ damage: start or restart oral therapy and review within 7 days.',
          'Organ damage without a special case: ICU and an IV infusion; systolic down by no more than 25% in the first hour, then under 160/100 over 2 to 6 hours.',
          'Aortic dissection: IV esmolol or labetalol first, systolic 120 or less within 20 minutes.',
          'Ischemic stroke for a lytic: below 185/110 before it and under 180/105 for 24 hours. No reperfusion: lower only at 220/120 or more, and then by 15% over 24 hours.',
          'Pregnant or postpartum, severe range: treat now with labetalol, oral nifedipine or IV hydralazine; magnesium for a seizure.',
        ],
        trap: 'Cocaine or amphetamine: a benzodiazepine first, then phentolamine or nitroglycerin. A beta blocker alone is wrong (unopposed alpha stimulation). The same goes for a suspected pheochromocytoma: no beta blocker first.',
        sources: 'AHA/ACC BP 2025, BIHS 2023, ACC/AHA aortic 2022, NICE NG133, StatPearls sympathomimetic toxicity and pheochromocytoma',
      },
      {
        id: 'leg',
        pathway: 'leg-swelling',
        name: 'Painful or swollen leg',
        first: 'Both legs: pulses, color, warmth, sensation and movement. A cold, pale, pulseless foot gets IV heparin and an emergency vascular review.',
        steps: [
          'Suspected DVT: the two-level Wells score. Unlikely: a D-dimer (age-adjusted over 50), and scan only if positive. Likely: compression ultrasound within 4 hours.',
          'DVT, not pregnant, no active cancer: apixaban or rivaroxaban with no heparin lead-in. Pregnant: LMWH. Active cancer: a DOAC (careful in GI cancers) or LMWH.',
          'Provoked by a factor that has passed: 3 months. Unprovoked: continue indefinitely if bleeding risk allows.',
          'Cellulitis without pus or MRSA risk: a beta-lactam such as cephalexin. A fluctuant abscess: incision and drainage.',
        ],
        trap: 'Necrotizing signs mean emergency debridement first; imaging must not delay the operating room.',
        sources: 'ASH VTE 2018 and 2020, NICE NG158, ACC/AHA PAD 2024, WSES skin and soft tissue 2018 and 2022',
      },
    ],
  },
  {
    title: 'Breathing and airway',
    items: [
      {
        id: 'dyspnea',
        pathway: 'dyspnea',
        name: 'Shortness of breath',
        first: 'Airway, oxygen to a target saturation, monitoring and an ECG.',
        steps: [
          'Tension pneumothorax: decompress now on the clinical signs, then a chest drain.',
          'Anaphylaxis: IM epinephrine 0.01 mg/kg (max 0.5 mg) into the outer thigh. Refractory on a beta blocker: an IV epinephrine infusion, fluids and IV glucagon.',
          'Shock with a dilated right ventricle on bedside echo (high-risk PE): systemic thrombolysis with unfractionated heparin.',
          'Stable possible PE: the two-level Wells score. Over 4 (likely): CTPA now, with no D-dimer (V/Q if contrast is a problem). 4 or less: PERC if suspicion is low; not satisfied, a D-dimer (age-adjusted over 50), and CTPA only if it is positive. Low-risk PE (sPESI 0, normal right ventricle and troponin) with support at home: home on apixaban or rivaroxaban.',
          'Severe asthma: high-dose SABA plus ipratropium and a systemic steroid; still under 40% of predicted after an hour: IV magnesium. COPD with persistent acidosis: oxygen to 88 to 92% and NIV.',
        ],
        trap: 'A normotensive PE with a strained right ventricle is admitted and anticoagulated, not routinely thrombolysed.',
        sources: 'BTS oxygen 2017, WAO anaphylaxis 2020, ESC PE 2019, NICE NG158, NG115 and NG114, NAEPP EPR-3 2007, ATS/IDSA CAP 2019',
      },
      {
        id: 'throat',
        pathway: 'throat-airway',
        name: 'Sore throat, stridor and nosebleed',
        first: 'Airway first: look for drooling, stridor, distress or swelling, and keep the patient calm.',
        steps: [
          'Child with fever, drooling and a tripod posture: controlled intubation in the operating room by anesthesia and ENT. No throat exam in the ED.',
          'Croup with stridor at rest, or a Westley score of 3 or more: nebulized epinephrine plus dexamethasone, then observe 3 to 4 hours after the last dose. No stridor at rest and Westley 2 or less: a single oral dose of dexamethasone, then home.',
          'Sore throat: score it with McIsaac (the Centor criteria plus 1 at age 3 to 14, minus 1 at 45 or older) and test at 2 or more; confirmed strep gets penicillin V or amoxicillin for 10 days. A mono picture: EBV testing and no amoxicillin.',
          'Tongue swelling on an ACE inhibitor: stop it for good; stridor or drooling means early awake fiberoptic intubation with a surgical airway ready.',
          'Nosebleed: lean forward and pinch the soft nose for 10 to 15 minutes; still bleeding, a topical vasoconstrictor such as oxymetazoline; then silver nitrate to a visible point on one side only, or anterior packing if none is seen.',
        ],
        trap: 'A child who choked on a peanut and is now wheezing gets chest films and then rigid bronchoscopy, even if the films are normal.',
        sources: 'NICE NG84, Singapore BCLS and PLS 2026, StatPearls acute and streptococcal pharyngitis, croup, epiglottitis, peritonsillar abscess and epistaxis',
      },
    ],
  },
  {
    title: 'Brain and nerves',
    items: [
      {
        id: 'stroke',
        pathway: 'stroke',
        name: 'Stroke and focal deficit',
        first: 'Airway, a fingerstick glucose and the time last known well. Low glucose is corrected before the deficit is judged.',
        steps: [
          'Deficit persists: non-contrast CT now, plus CT angiography if thrombectomy is possible.',
          'No bleed, under 4.5 hours, disabling: a lytic once the pressure is below 185/110 (alteplase 0.9 mg/kg, max 90 mg, 10% as a bolus over 1 minute).',
          'Proximal anterior occlusion within 6 hours, NIHSS over 5: thrombectomy as soon as possible. From 4.5 to 24 hours: CT angiography plus CT perfusion or diffusion MRI to find brain worth saving.',
          'Symptoms fully resolved (TIA): aspirin 300 mg now and specialist assessment within 24 hours; a high-risk TIA (ABCD2 4 or more) or a minor stroke (NIHSS 3 or less) within 24 hours gets aspirin plus clopidogrel for 21 days.',
          'Hemorrhage on warfarin: 4-factor PCC with IV vitamin K. On dabigatran: idarucizumab. On apixaban or rivaroxaban: stop it and give 4-factor PCC off-label.',
        ],
        trap: 'Andexanet alfa is no longer an option in the US: its US sales ended on 22 December 2025, and the FDA considers its risks to outweigh its benefits. Anything written before then may still list it.',
        sources: 'NICE NG128, ESO 2021 and 2024, FDA Activase, Kcentra and Praxbind labels, FDA andexanet communication 2025',
      },
      {
        id: 'headache',
        pathway: 'headache',
        name: 'Headache',
        first: 'Vital signs, GCS and a neurologic exam with the fundi; time the onset and screen for red flags.',
        steps: [
          'Thunderclap headache: urgent non-contrast CT. Clear within 6 hours of onset and read by a radiologist: senior review, and an LP only if doubt remains. Clear after 6 hours: LP at least 12 hours after onset for xanthochromia.',
          'Subarachnoid hemorrhage: CT angiography, an urgent neurosurgical call, and enteral nimodipine 60 mg every 4 hours.',
          'Over 50 with GCA features: ESR and CRP, and glucocorticoids today; pulse IV methylprednisolone if vision is affected; biopsy within 2 weeks.',
          'Venous sinus thrombosis: therapeutic LMWH now, even with a venous hemorrhage.',
          'Migraine that failed at home: IV metoclopramide or prochlorperazine with an IV NSAID. Cluster: 100% oxygen at 12 L/min or more, or sumatriptan 6 mg SC.',
        ],
        trap: 'Waiting for the temporal artery biopsy before steroids is the classic wrong answer. Steroids start today, and a biopsy within 2 weeks of starting them still makes the diagnosis.',
        sources: 'NICE NG228 and CG150, EULAR 2018 and 2025, ESO aSAH 2026, FDA nimodipine label',
      },
      {
        id: 'seizure',
        pathway: 'seizure',
        name: 'Seizure',
        first: 'Airway, a fingerstick glucose and the time the seizure began.',
        steps: [
          'Still seizing at 5 minutes: IV lorazepam 4 mg in an adult over 40 kg, one repeat; with no IV, midazolam 10 mg IM.',
          'Still seizing after the benzodiazepine: one second-line load (levetiracetam, fosphenytoin or valproate). Still seizing at 40 minutes: another second-line drug or anesthetic doses on continuous EEG.',
          'Glucose under 60 mg/dL: thiamine 100 mg IV, then 50 mL of 50% dextrose. Sodium under 120: 3% saline for a 5 mmol/L rise. Eclampsia: IV magnesium.',
          'An empty isoniazid bottle: IV pyridoxine, gram for gram, or 5 g if the amount is unknown.',
        ],
        trap: 'A first unprovoked seizure with a normal exam, sodium and ECG gets no drug yet: an urgent first-seizure referral, EEG and imaging, and no driving.',
        sources: 'AES 2016, NICE NG217, FDA lorazepam, diazepam and fosphenytoin labels, SfE hyponatraemia 2016',
      },
      {
        id: 'ams',
        pathway: 'altered-mental-status',
        name: 'Altered mental status',
        first: 'ABC, oxygen saturation, a capillary glucose, vitals and temperature.',
        steps: [
          'Pinpoint pupils with slow breathing: ventilate, then naloxone 0.4 to 2 mg IV, repeated.',
          'Fever with confusion: blood cultures, then IV antibiotics within the hour. They are not held for a scan.',
          'A malnourished heavy drinker: parenteral thiamine now, before or with any glucose.',
          'Known COPD with a respiratory acidosis: oxygen to 88 to 92%, then NIV if the acidosis persists.',
          'Delirium: look for the cause (drugs, bladder, bowel, pain, infection) and stop the offending drug; de-escalate before short-term low-dose haloperidol.',
        ],
        trap: 'Myxedema coma gets IV hydrocortisone first, then IV levothyroxine.',
        sources: 'NICE CG103 and NG232, AGS Beers 2023, JBDS hypoglycaemia 2023, FDA naloxone and thiamine labels',
      },
      {
        id: 'weakness',
        pathway: 'weakness',
        name: 'Acute weakness',
        first: 'Airway, cough and swallow, a fingerstick glucose, then bedside FVC with inspiratory and expiratory pressures if the weakness is generalized or bulbar.',
        steps: [
          'FVC under 20 mL/kg, MIP under 30 or MEP under 40 cm H2O: ICU and ventilatory support before the blood gas fails.',
          'A sensory level: emergency MRI of the whole spine with and without gadolinium.',
          'Ascending weakness with absent reflexes: LP and nerve conduction. Cannot walk 10 m unaided within 2 weeks of onset: IVIG 0.4 g/kg daily for 5 days, or plasma exchange.',
          'Known myasthenia, weaker on pyridostigmine: look for cholinergic signs before giving more. Myasthenic crisis: IVIG or plasma exchange in intensive care.',
          'Descending weakness, alert and afebrile, cranial nerves first: call public health for antitoxin, and draw serum before it runs.',
        ],
        trap: 'A normal blood gas does not make a GBS patient safe. The bedside breathing numbers decide intubation.',
        sources: 'Leonhard 2019 GBS ten steps, CDC botulism 2021, German MG guideline 2023, StatPearls GBS and periodic paralysis',
      },
    ],
  },
  {
    title: 'Abdomen, kidney and pelvis',
    items: [
      {
        id: 'abdominal-pain',
        pathway: 'abdominal-pain',
        name: 'Abdominal pain',
        first: 'Vitals, IV access, blood count, lactate, electrolytes and creatinine, and a pregnancy test in anyone who could be pregnant.',
        steps: [
          'Suspected ruptured AAA in shock: permissive hypotension and straight to repair; CT only if stable enough.',
          'Right upper quadrant with fever: ultrasound with liver tests. Acute cholecystitis, fit for surgery: laparoscopic cholecystectomy within 7 days of admission and 10 of symptoms.',
          'Right lower quadrant: score it (AIR or AAS) and image with ultrasound first; if unclear, MRI in pregnancy and low-dose CT in other adults, with no routine CT in a child. Uncomplicated appendicitis: appendectomy within 24 hours, or antibiotics first after discussing recurrence, but never with an appendicolith or in pregnancy.',
          'Acute pancreatitis without organ failure: early isotonic crystalloid, reassessed often, and no prophylactic antibiotics.',
          'Pain out of proportion: lactate and CT angiography without delay for mesenteric ischemia.',
        ],
        trap: 'Arterial flow on Doppler does not exclude ovarian torsion. An enlarged ovary with a whirlpool sign goes to surgery.',
        sources: 'WSES appendicitis, cholecystitis, pancreatitis and mesenteric ischemia, AGA diverticulitis 2021, NICE NG126, ACC/AHA aortic 2022',
      },
      {
        id: 'gi-bleed',
        pathway: 'gi-bleed',
        name: 'GI bleeding',
        first: 'Two large-bore IVs, crossmatch, blood count and clotting; ask about anticoagulants, antiplatelets and liver disease.',
        steps: [
          'Transfuse restrictively, below 7 to 8 g/dL (higher with heart disease); massive bleeding follows its protocol.',
          'Upper bleed, stable: the Glasgow-Blatchford score. 0 or 1: discharge with outpatient endoscopy. Admitted: endoscopy within 24 hours.',
          'High-risk stigmata: clips or thermal therapy, usually with epinephrine injection, then an 80 mg IV PPI bolus and 8 mg/h for 72 hours.',
          'Cirrhosis: a vasoactive drug and antibiotic prophylaxis before endoscopy, endoscopy within 12 hours, band ligation for varices.',
          'Brisk hematochezia, still hypotensive: CT angiography and embolization of any bleeding point (or upper endoscopy first if an upper source is likely).',
        ],
        trap: 'On warfarin and still bleeding: PCC with vitamin K, without delaying the endoscopy for it.',
        sources: 'International Consensus 2019, NICE CG141, Baveno VII 2022, ACR GI bleeding 2021 and 2024, Kcentra label',
      },
      {
        id: 'flank-pain',
        pathway: 'flank-pain',
        name: 'Flank pain and urinary retention',
        first: 'Vitals, abdomen, bladder exam, a urine test and an hCG where relevant. An aneurysm or shock without fever goes elsewhere first.',
        steps: [
          'Suspected renal colic: an NSAID first (for example IV ketorolac), then low-dose non-contrast CT.',
          'Distal ureteric stone 5 to under 10 mm, pain controlled: tamsulosin with an NSAID and urology follow-up.',
          'Pyelonephritis: urine culture before antibiotics; image only if high risk. Still febrile at 72 hours: CT with contrast.',
          'Retention: a urethral catheter, draining the bladder fully at once. From an enlarged prostate: tamsulosin, then a trial without catheter in 2 to 7 days.',
        ],
        trap: 'Infection behind an obstructing stone needs urgent decompression (stent or nephrostomy). Antibiotics alone are the wrong answer.',
        sources: 'NICE NG118 and CG97, ACR flank pain 2023 and obstruction 2019, SSC 2021',
      },
      {
        id: 'scrotal-pain',
        pathway: 'scrotal-pain',
        name: 'Scrotal pain',
        first: 'Vitals and a full exam of testes, groin and perineum now.',
        steps: [
          'Acute testicular pain without trauma, hernia or mass: score TWIST (swelling, hardness, absent reflex, nausea, high testis).',
          'TWIST 5 or more in an adolescent: urology for emergency exploration, with no ultrasound first. Low or intermediate risk: color Doppler of both testes now.',
          'Theatre hours away: manual detorsion outward while the transfer is arranged.',
          'Epididymitis with gonorrhea or chlamydia likely: ceftriaxone 500 mg IM once plus doxycycline 100 mg twice daily for 10 days. After insertive anal sex: ceftriaxone plus levofloxacin.',
        ],
        trap: 'Necrotizing infection of the perineum (Fournier) is debrided now, without waiting for imaging.',
        sources: 'CDC STI 2021, ESPR 2015, WSES skin and soft tissue 2018 and 2022, torsion reviews 2020 to 2025',
      },
      {
        id: 'pregnancy-bleeding',
        pathway: 'pregnancy-bleeding',
        name: 'Bleeding in pregnancy',
        first: 'Airway, breathing, pulse and vitals; IV access, blood count, group and Rh, and an hCG if not known.',
        steps: [
          'Early pregnancy in shock with free fluid and an empty uterus: emergency surgery for a ruptured ectopic.',
          'Early pregnancy, stable: transvaginal ultrasound for location and heartbeat, with a speculum exam.',
          'Bleeding after 20 weeks: the placental site from earlier scans or ultrasound before any digital exam, and continuous fetal monitoring.',
          'Postpartum hemorrhage: call for help, uterine massage, IV oxytocin, tranexamic acid 1 g IV within 3 hours of birth, and fluids, then find the cause.',
          'RhD negative and not sensitized, bleeding after 20 weeks: anti-D within 72 hours.',
        ],
        trap: 'Second-line uterotonics have contraindications Step 2 loves: no methylergonovine with high blood pressure, no carboprost with asthma (misoprostol 800 micrograms instead).',
        sources: 'NICE NG126, NG121 and NG235, WHO PPH 2025, FIGO PPH 2022, FIGO Rh 2021',
      },
    ],
  },
  {
    title: 'Metabolic, electrolytes and sepsis',
    items: [
      {
        id: 'dka',
        pathway: 'dka-hhs',
        name: 'DKA and HHS',
        first: 'ABCs, large-bore IV access and isotonic fluid, with an ECG and a cardiac monitor.',
        steps: [
          'First hours: 0.9% saline or a balanced crystalloid at 500 to 1,000 mL/h for 2 to 4 hours.',
          'Potassium before insulin. Below 3.5 mmol/L: hold the insulin and give IV potassium. 3.5 to 5.0: insulin with potassium in every liter. Over 5.0: insulin, no potassium yet.',
          'Insulin: a fixed-rate IV infusion at 0.1 units/kg/h. Once glucose is under 250 mg/dL with ketones still raised: add 5 to 10% dextrose and drop to 0.05 units/kg/h, without stopping it.',
          'Bicarbonate is considered only for a venous pH under 7.0.',
          'HHS: saline first; insulin (0.05 units/kg/h) only once the glucose stops falling on fluid alone.',
        ],
        trap: 'Euglycemic DKA on an SGLT2 inhibitor needs dextrose with the saline from the start, plus insulin. A normal glucose does not mean no DKA.',
        sources: 'ADA/EASD hyperglycemic crises consensus 2024, JBDS DKA 2023, JBDS HHS 2022, ADA 2009',
      },
      {
        id: 'electrolytes',
        pathway: 'electrolytes',
        name: 'Electrolyte emergencies',
        first: 'A cardiac monitor and a 12-lead ECG, with a blood gas for the potassium.',
        steps: [
          'High potassium with ECG changes: IV calcium gluconate now, repeated if the ECG has not improved; then insulin 10 units IV with glucose, plus nebulized albuterol.',
          'High potassium with a normal ECG: confirm it on a blood gas or a fresh free-flowing sample, since pseudohyperkalemia is common.',
          'Potassium under 2.5, or low with ECG changes: IV potassium chloride in saline by pump on a monitor, and check the magnesium. A shift from periodic paralysis gets oral potassium first.',
          'Low sodium with severe symptoms: 3% saline now for a rise of about 5 mmol/L. Euvolemic with a concentrated urine: fluid restriction once TSH and cortisol are normal.',
          'Calcium of 3.0 mmol/L (12 mg/dL) or more, or symptomatic: IV saline, 4 to 6 L over 24 hours, then zoledronic acid if it stays high with a cancer.',
        ],
        trap: 'An ampule of D50 is 50 mL holding 25 g of glucose, not 50 g. The insulin shift pairs 10 units with 25 g.',
        sources: 'UK Kidney Association 2020, JACEP Open 2021, SfE hyponatraemia and hypercalcaemia 2016, FDA calcium gluconate and potassium chloride labels',
      },
      {
        id: 'tox',
        pathway: 'overdose',
        name: 'Overdose and poisoning',
        first: 'ABCs, a fingerstick glucose, an ECG and a call to the poison center.',
        steps: [
          'Slow, shallow breathing: naloxone 0.4 to 2 mg IV, repeated every 2 to 3 minutes.',
          'QRS of 0.10 seconds or more: IV sodium bicarbonate to a serum pH of 7.45 to 7.55.',
          'Beta blocker overdose: IV glucagon. Calcium channel blocker: IV calcium. Still in shock on the antidote and norepinephrine: high-dose insulin, 1 unit/kg, then 0.5 to 1 unit/kg/h.',
          'Acetaminophen at a known time: plot a level at 4 hours or later on the nomogram. Time unknown or staggered: start acetylcysteine now (150 mg/kg over 1 hour, 50 over 4 hours, 100 over 16 hours).',
          'Toxic alcohol: fomepizole 15 mg/kg IV. Organophosphate: atropine 2 to 4 mg IV every 5 to 10 minutes until the secretions dry.',
        ],
        trap: 'No flumazenil for a regular benzodiazepine user or a mixed overdose: it can bring on seizures. Support the airway and breathing instead.',
        sources: 'FDA Acetadote, naloxone, flumazenil, fomepizole, DigiFab and atropine labels, EXTRIP 2023',
      },
      {
        id: 'sepsis',
        pathway: 'sepsis-fever',
        name: 'Sepsis and fever',
        first: 'Vitals and a lactate; screen with SIRS, NEWS or MEWS. qSOFA alone is not a screen.',
        steps: [
          'Possible septic shock: cultures, antibiotics within 1 hour and at least 30 mL/kg of crystalloid.',
          'MAP still low: norepinephrine to a MAP of 65, peripherally until a central line is in. Norepinephrine at 0.25 mcg/kg/min or more: add vasopressin 0.03 units/min and IV hydrocortisone 200 mg a day.',
          'Possible sepsis without shock, infection uncertain: a rapid workup and antibiotics within 3 hours if concern persists.',
          'Suspected meningitis: blood cultures, an LP first if it is safe, and antibiotics within 1 hour; dexamethasone with the first dose; add ampicillin for a Listeria risk.',
          'Fever within 6 weeks of chemotherapy: assess within 15 minutes and give the first antibiotic within the hour (cefepime, a carbapenem or piperacillin-tazobactam).',
        ],
        trap: 'An infected, obstructed kidney or a necrotizing soft tissue infection needs source control now; more antibiotics is not the answer.',
        sources: 'Surviving Sepsis 2021 and 2026, IDSA meningitis 2004, ASCO/IDSA 2018, WHO meningitis 2025',
      },
    ],
  },
  {
    title: 'Trauma, bones and joints',
    items: [
      {
        id: 'trauma',
        pathway: 'trauma',
        name: 'Major trauma',
        first: 'Stop catastrophic external bleeding, then airway with the neck held, breathing, circulation, disability and exposure.',
        steps: [
          'Tension pneumothorax with low pressure: decompress before imaging. Sucking chest wound: an occlusive dressing taped on three sides.',
          'Hypotensive and bleeding: massive transfusion with plasma, platelets and red cells in a fixed ratio, plus TXA; then eFAST with chest and pelvic films.',
          'FAST positive and hypotensive: laparotomy. Pelvic ring disrupted: a binder centered on the greater trochanters, then angioembolization or packing.',
          'Pregnant with the uterus above the umbilicus, hypotensive lying flat: manual left uterine displacement.',
          'Stable after blunt trauma: contrast CT. A stable splenic laceration: non-operative management with serial exams.',
        ],
        trap: 'An anticoagulated patient who hit their head with a GCS of 15 still gets a CT head now, before any decision about reversal.',
        sources: 'NICE NG39 and NG41, European bleeding guideline 2023, ACS TQIP 2014 to 2023, WSES thoracic, pelvic, spleen and liver',
      },
      {
        id: 'limb-injury',
        pathway: 'limb-injury',
        name: 'Limb injury',
        first: 'Primary survey and bleeding control, then document the nerves and pulses in both limbs.',
        steps: [
          'No pulse below a deformed limb: realign and splint, then recheck. Still pulseless: vascular and orthopedic surgery, with revascularization begun within the hour.',
          'Open fracture: IV antibiotics, tetanus, a photo, a saline-soaked dressing, then the splint.',
          'Feared compartment syndrome: split the cast and dressings to skin and recheck in 30 minutes. Signs persist, or the pressure gap is under 30 mmHg: fasciotomy.',
          'Ankle, midfoot or knee: an x-ray only if the Ottawa rule says so. Snuffbox tenderness: immobilize, x-ray, then MRI or repeat films if clear.',
          'Hip fracture in an older adult: surgery on the day of admission or the next.',
        ],
        trap: 'A knee dislocation that has gone back in with pulses present still needs an ABI. A normal pulse does not clear the artery.',
        sources: 'NICE NG37 and NG38, BOAST open fractures, compartment syndrome and arterial injury, ACR musculoskeletal ratings',
      },
      {
        id: 'back-pain',
        pathway: 'back-pain',
        name: 'Back pain',
        first: 'Vitals, the abdomen for a pulsatile mass, red flags and a neurologic exam.',
        steps: [
          'Infection risk (injection drug use, fever, recent procedure): blood cultures, ESR and CRP, then emergent MRI with gadolinium. Epidural abscess: IV antibiotics and emergency spine surgery review.',
          'Known cancer with new neurological signs: dexamethasone now, oncology, and a whole-spine MRI as soon as possible.',
          'Possible cauda equina: a bladder scan, perianal sensation, and an emergency MRI within 4 hours of the request.',
          'No red flags: no imaging; stay active and an NSAID at the lowest effective dose.',
        ],
        trap: 'Imaging uncomplicated back pain without red flags is the wrong answer, however worried the patient is.',
        sources: 'NICE NG59, ACR low back pain 2021, VA/DoD 2022, GIRFT cauda equina 2026',
      },
      {
        id: 'hot-joint',
        pathway: 'hot-joint',
        name: 'Hot swollen joint',
        first: 'Vital signs and a sepsis screen; ask about a joint replacement and a bleeding disorder.',
        steps: [
          'Stable, native joint: aspirate before antibiotics (cell count, Gram stain, culture, crystals) and send blood cultures.',
          'Gram-positive cocci: IV vancomycin. Gram-negative rods in someone who injects drugs: vancomycin plus ceftazidime.',
          'Tenosynovitis with skin lesions in a sexually active patient: test every exposed site, then ceftriaxone 1 g every 24 hours plus doxycycline unless chlamydia is excluded.',
          'A gout flare on allopurinol: keep the allopurinol going unchanged. Starting it: 100 mg a day or less with colchicine cover, titrated to a urate under 6.',
          'Hemophilia A with a joint bleed: factor VIII now, before any imaging or needle.',
        ],
        trap: 'Crystals in the fluid do not exclude infection. Crystals with a septic-range count are treated as septic arthritis.',
        sources: 'ACR gout 2020, NICE NG219, CDC STI 2021, StatPearls septic arthritis, SSC 2021',
      },
      {
        id: 'eye',
        pathway: 'eye',
        name: 'Red eye and sudden vision loss',
        first: 'ABCs and the story first; a chemical splash is irrigated at once, and every other eye gets the visual acuity checked.',
        steps: [
          'Chemical splash: irrigate after an anesthetic drop until the pH reads 7.0 to 7.4.',
          'Possible open globe: a rigid shield with no pressure, an antiemetic, IV antibiotics, nil by mouth, CT orbits and ophthalmology.',
          'Tense, bulging eye after trauma with vision falling: lateral canthotomy and cantholysis now, before any imaging.',
          'Acute angle closure: timolol, an alpha-2 agonist and IV acetazolamide, pilocarpine as the pressure falls, then iridotomy.',
          'Cherry-red spot with sudden painless loss: treat it as a stroke, with ESR and CRP and a stroke-team review.',
        ],
        trap: 'Corneal abrasions are no longer patched, and the anesthetic drops never go home with the patient.',
        sources: 'EGS 2025, Eye CRAO review 2024, Eye open globe review 2024, CEHJ 2018, StatPearls corneal abrasion',
      },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

const DISAGREE: { topic: string; sides: string; answer: string }[] = [
  {
    topic: 'Blood pressure after an intracerebral hemorrhage',
    sides: 'AHA/ACC 2025 aims for a systolic of 130 to 139 and stops below 130; NICE aims for 140 or below, falling no more than 60 in the first hour; the British and Irish society calls 140 to 180 appropriate.',
    answer: 'Smooth lowering, never below 130 and no more than 60 down in the first hour. The US and NICE targets overlap at 130 to 140.',
  },
  {
    topic: 'Potassium before insulin in DKA',
    sides: 'The 2024 ADA/EASD consensus holds insulin until potassium is above 3.5 mmol/L; ADA 2009 used 3.3 mEq/L.',
    answer: 'Potassium first either way; older US teaching uses 3.3.',
  },
  {
    topic: 'Phosphate replacement in DKA',
    sides: 'The 2024 consensus prints a cutoff of 1.0 mmol/L (about 3.1 mg/dL, inside the normal range); ADA 2009 used 1.0 mg/dL.',
    answer: 'Replace only with weakness or respiratory or cardiac compromise and a severely low level.',
  },
  {
    topic: 'How fast to correct chronic low sodium',
    sides: 'The UK endocrine guidance stops at 10 mmol/L in 24 hours and 18 in 48; StatPearls gives 8 to 12 a day, 6 to 8 when the low sodium has lasted 48 hours or more or for an unknown time, and its SIADH chapter no more than 8.',
    answer: 'Stay within 8 to 10 mmol/L in 24 hours, and go slower when the patient is high risk (alcohol, malnutrition, liver disease, low potassium).',
  },
  {
    topic: 'Fluid for sepsis-induced hypoperfusion',
    sides: 'Surviving Sepsis gives at least 30 mL/kg of crystalloid within 3 hours; NICE NG253 (2025) gives 250 mL boluses over 10 to 15 minutes, up to 1,000 mL in all, reassessing after each.',
    answer: 'The US exam answer is at least 30 mL/kg of balanced crystalloid within 3 hours, with antibiotics inside the first hour.',
  },
  {
    topic: 'Observation after nebulized epinephrine in croup',
    sides: 'The same review gives 4 hours in one section and 3 in another.',
    answer: 'Observe 3 to 4 hours after the last dose; admit if not improving.',
  },
  {
    topic: 'Labetalol after cocaine',
    sides: 'The UK hypertension society lists it and a cocaine review reports it safe; the sympathomimetic review calls any beta blockade controversial.',
    answer: 'Benzodiazepine first. If a beta blocker appears as the first drug for cocaine chest pain, it is the wrong option.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is the first step for chest pain on Step 2 CK?',
    a: 'A 12-lead ECG within 10 minutes of first contact. ST elevation goes to reperfusion (primary PCI within 90 minutes of first contact, or fibrinolysis when PCI is more than 120 minutes away); no ST elevation goes to high-sensitivity troponin now and at 1 to 2 hours; aortic features go to CT angiography.',
  },
  {
    q: 'What is the next best step for hyperkalemia with ECG changes?',
    a: 'IV calcium gluconate now, repeated if the ECG does not improve. Then shift potassium into cells with 10 units of IV insulin and glucose plus nebulized albuterol, and remove it with a binder or dialysis.',
  },
  {
    q: 'When do you give bicarbonate in DKA?',
    a: 'It is considered only when the venous pH is under 7.0, and then only to bring it above 7.0. Above that, fluid and insulin clear the acidosis on their own.',
  },
  {
    q: 'Do you need a CT before the LP in suspected meningitis?',
    a: 'Only when a CT criterion is present: altered consciousness, focal signs, papilledema, a new seizure, immunocompromise or CNS disease. With none, and nothing else making the LP unsafe, the LP goes first and dexamethasone and antibiotics follow at once. When the LP has to wait, blood cultures, dexamethasone and antibiotics go first and are never held for the scan.',
  },
  {
    q: 'What is the next best step for suspected testicular torsion?',
    a: 'Score it with TWIST. An adolescent scoring 5 or more goes to emergency surgical exploration without an ultrasound first; lower scores get color Doppler of both testes now.',
  },
  {
    q: 'What is first-line treatment for anaphylaxis?',
    a: 'IM epinephrine 0.01 mg/kg, to a maximum of 0.5 mg, into the outer thigh, repeated every 5 to 15 minutes if needed. Antihistamines and steroids are second line.',
  },
  {
    q: 'How is anticoagulant-associated brain hemorrhage reversed now that andexanet is gone?',
    a: 'Warfarin: 4-factor PCC with IV vitamin K. Dabigatran: idarucizumab. Apixaban or rivaroxaban: stop the drug and give 4-factor PCC off-label. Andexanet alfa was withdrawn from the US market in December 2025.',
  },
];

/** The pathway articles this build publishes, slug to title: a card links its
 *  full pathway only when that page exists, so a gated build never links a 404. */
type Live = Record<string, string>;

function PresentationCard({ p, live }: { p: Presentation; live: Live }) {
  const full = live[p.pathway];
  return (
    <section className="pres" id={p.id}>
      <h3>{p.name}</h3>
      <div className="row first"><span className="k">First</span><p>{p.first}</p></div>
      <div className="row"><span className="k">Then</span>
        <ul>{p.steps.map((s) => <li key={s}>{s}</li>)}</ul>
      </div>
      <div className="row trap"><span className="k">Trap</span><p>{p.trap}</p></div>
      <div className="src">Sources: {p.sources}</div>
      {full && (
        <Link className="full" href={`/pathways/${p.pathway}`}>
          Full pathway: {full}<span aria-hidden="true">&rarr;</span>
        </Link>
      )}
    </section>
  );
}

export default function EdNextBestStep({ live }: { live: Live }) {
  const liveCount = Object.keys(live).length;
  const store = appStoreUrl(CAMPAIGN);
  const title = 'Step 2 CK emergency medicine: the next best step for 26 ED presentations';
  const desc = 'The first move, the fork and the trap for 26 ED chief complaints on Step 2 CK, from chest pain to scrotal pain, with doses from current guidelines.';
  const storeClick = (location: string) => () => track('store_click', { source: CAMPAIGN, location, ref: referrerHost() });
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: desc,
      datePublished: PUBLISHED,
      dateModified: PUBLISHED,
      author: { '@type': 'Person', name: 'Danny Varghese', description: 'MS4, Texas A&M College of Medicine', url: 'https://stepgunner.com' },
      publisher: { '@type': 'Organization', name: 'Step Gunner', url: 'https://stepgunner.com' },
      mainEntityOfPage: `https://stepgunner.com${PATH}`,
      about: ['USMLE Step 2 CK', 'emergency medicine', 'next best step', 'emergency department management'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <LabLayout
      eyebrow="Study guide"
      title="The next best step in the ED"
      lede={<>26 emergency presentations the way Step 2 CK asks them: the first move, the fork that decides everything after it, and the one trap each is built around. Doses and thresholds from current guidelines, and a straight answer where those guidelines disagree.</>}
      crumb={[{ href: '/guides', label: 'Guides' }, { href: PATH, label: 'Emergency medicine' }]}
      metaTitle="Step 2 CK Emergency Medicine: Next Best Step for 26 Presentations"
      metaDesc={desc}
      ogImage="/og/step-2-ck-emergency-medicine.png"
      campaign={CAMPAIGN}
      head={<>
        <link rel="canonical" href={`https://stepgunner.com${PATH}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </>}
    >
      <style jsx global>{`
        .prose h2 { font-size: 23px; font-weight: 800; letter-spacing: -0.4px; margin: 44px 0 12px; text-wrap: balance; }
        .prose p { color: var(--ink-dim); font-size: 15.5px; line-height: 1.75; margin: 0 0 14px; }
        .prose p strong, .prose li strong { color: var(--ink); }
        .prose ul { margin: 0 0 16px 22px; } .prose li { color: var(--ink-dim); font-size: 15.5px; line-height: 1.7; margin-bottom: 7px; } .prose li::marker { color: var(--green); }
        .prose a { color: var(--blue); } .prose a:hover { text-decoration: underline; }
        .byline { display: flex; flex-wrap: wrap; gap: 8px 18px; font-family: var(--mono); font-size: 11px; color: var(--ink-faint); letter-spacing: 0.3px; margin: -8px 0 24px; }
        .byline b { color: var(--ink-dim); font-weight: 600; }
        .abstract { background: var(--bg-2); border: 1px solid var(--hair-strong); border-radius: 16px; padding: 20px 22px; margin-bottom: 18px; }
        .abstract .k { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: var(--green); margin-bottom: 8px; }
        .abstract p { font-size: 15px; margin: 0 0 10px; color: var(--ink); line-height: 1.75; } .abstract p:last-child { margin: 0; }
        .pitch { margin: 18px 0 8px; background: var(--ink); border-radius: 18px; padding: 22px 22px 20px; color: #ffffff; position: relative; overflow: hidden; }
        .pitch:before { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 90% at 85% 0%, rgba(240,180,41,0.22), transparent 60%); }
        .pitch > * { position: relative; }
        .pitch .pk { font-family: var(--mono); font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.55); }
        .pitch .ph { font-size: 19px; font-weight: 800; margin: 6px 0 6px; letter-spacing: -0.3px; }
        .pitch .ps { font-size: 14px; color: rgba(255,255,255,0.72); line-height: 1.6; max-width: 56ch; margin: 0 0 14px; }
        .pitch .row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .pitch .btn-store { display: inline-flex; align-items: center; gap: 9px; background: var(--gold); color: #1a1403; font-weight: 800; font-size: 14px; padding: 12px 18px; border-radius: 12px; }
        .pitch .btn-store:hover { filter: brightness(1.06); }
        .pitch .btn-calc { display: inline-flex; align-items: center; padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.28); color: #fff; font-weight: 700; font-size: 14px; }
        .jump { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 6px 18px; margin: 6px 0 22px; padding: 0; list-style: none; }
        .jump li { margin: 0; font-size: 14px; } .jump li::marker { content: ""; }
        .jump .g { grid-column: 1 / -1; font-family: var(--mono); font-size: 10.5px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); margin-top: 10px; }
        .rules { counter-reset: r; list-style: none; margin: 0 0 18px; padding: 0; }
        .rules li { counter-increment: r; position: relative; padding-left: 34px; margin-bottom: 12px; }
        .rules li:before { content: counter(r); position: absolute; left: 0; top: 1px; width: 22px; height: 22px; border-radius: 11px; background: var(--ink); color: #fff; font: 700 12px/22px var(--mono); text-align: center; }
        .pres { background: var(--bg-2); border: 1px solid var(--hair); border-radius: 14px; padding: 18px 20px 14px; margin: 0 0 14px; scroll-margin-top: 80px; }
        .pres h3 { font-size: 18px; font-weight: 800; margin: 0 0 12px; letter-spacing: -0.2px; }
        .pres .row { display: grid; grid-template-columns: 62px 1fr; gap: 10px; align-items: start; margin-bottom: 8px; }
        .pres .row > * { min-width: 0; }
        .pres .k { font-family: var(--mono); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); padding-top: 4px; }
        .pres .row p { margin: 0; color: var(--ink); font-size: 15px; line-height: 1.65; }
        .pres .row ul { margin: 0 0 0 18px; } .pres .row li { font-size: 14.5px; margin-bottom: 5px; }
        .pres .trap { background: rgba(240,180,41,0.09); border-radius: 10px; padding: 8px 10px; margin: 10px -10px 6px; }
        .pres .trap .k { color: var(--gold); }
        .pres .src { font-family: var(--mono); font-size: 10.5px; color: var(--ink-faint); letter-spacing: 0.2px; line-height: 1.5; margin-top: 8px; }
        .pres .full { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; font-size: 14px; font-weight: 700; color: var(--blue); }
        .pres .full:hover { text-decoration: underline; }
        .prose .hubline { font-size: 15px; margin: 0 0 18px; }
        .tblwrap { overflow-x: auto; margin: 8px 0 24px; }
        .tbl { width: 100%; border-collapse: collapse; font-size: 14.5px; background: var(--bg-2); border: 1px solid var(--hair); border-radius: 12px; overflow: hidden; }
        .tbl th { text-align: left; font-family: var(--mono); font-size: 10.5px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink-faint); padding: 9px 12px; border-bottom: 1px solid var(--hair-strong); background: var(--bg-3); }
        .tbl td { padding: 10px 12px; border-bottom: 1px solid var(--hair); color: var(--ink-dim); vertical-align: top; line-height: 1.55; } .tbl tr:last-child td { border-bottom: 0; }
        .tbl td b { color: var(--ink); }
        .faq h3 { font-size: 16px; font-weight: 800; margin: 22px 0 6px; }
        .cta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 28px 0 10px; }
        .cta a { display: block; text-align: center; padding: 16px 14px; border-radius: 12px; font-weight: 800; font-size: 14px; }
        .cta a:hover { filter: brightness(1.05); }
        .cta .pri { background: var(--ink); color: #fff; } .cta .sec { border: 1px solid var(--hair-strong); color: var(--ink); background: var(--bg-2); }
        .cta small { display: block; font-family: var(--mono); font-size: 10px; letter-spacing: 1px; text-transform: uppercase; opacity: 0.65; margin-top: 4px; font-weight: 600; }
        @media (max-width: 640px) { .tbl { font-size: 13.5px; } .cta { grid-template-columns: 1fr; } .pres .row { grid-template-columns: 1fr; gap: 2px; } .pres .trap { margin: 10px 0 6px; } }
      `}</style>

      <div className="prose">
      <div className="byline">
        <span><b>Danny Varghese</b>, MS4, Texas A&amp;M College of Medicine</span>
        <span>Published {PUBLISHED}</span>
        <span>26 presentations</span>
        <span>About 20 minutes</span>
      </div>

      <div className="abstract">
        <div className="k">The short answer</div>
        <p>Almost every ED question on Step 2 CK asks for one of two things: the first move, or the fork that decides everything after it. The first move is nearly always the bedside test that changes the plan within minutes: an ECG for chest pain, palpitations and syncope; a fingerstick glucose for confusion, seizure, stroke and weakness; a pregnancy test for abdominal pain and bleeding.</p>
        <p>The fork is a result: ST elevation or not, potassium above or below 3.5, a TWIST score of 5 or more. And the trap is usually a test ordered when the answer was to treat. You decompress a tension pneumothorax on the signs, give antibiotics before the CT in meningitis, and give dexamethasone before the MRI in cord compression.</p>
      </div>

      {liveCount > 0 && (
        <p className="hubline">
          Each presentation below links to its full pathway, with every fork, every order and dose, and the source behind each one. Browse all {liveCount} in <Link href="/pathways">ED pathways</Link>.
        </p>
      )}

      <section className="pitch">
        <div className="pk">Practice the next best step</div>
        <div className="ph">Reading an algorithm is not the same as answering one.</div>
        <p className="ps">Step Gunner drills the next best step case by case, walks each management chain one decision at a time, and brings back the steps you miss with spaced repetition until they stick. Free to start.</p>
        <div className="row">
          <a href={store} className="btn-store" onClick={storeClick('pitch_top')}>Get Step Gunner free</a>
          <Link href="/readiness" className="btn-calc" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'pitch_top' })}>Check your Step 2 readiness</Link>
        </div>
      </section>

      <h2>How the ED question is built</h2>
      <p>Most ED stems run the same way. Read them in this order and the answer choices sort themselves:</p>
      <ol className="rules">
        <li><strong>Is the patient unstable?</strong> Shock, a threatened airway or a falling GCS gets its own route before any diagnosis. A patient in shock never goes to the scanner as the next step; a threatened airway is secured first, and a falling GCS then goes straight to a non-contrast CT.</li>
        <li><strong>What is the one bedside test?</strong> ECG, fingerstick glucose, pregnancy test, blood gas, bedside echo. If the stem has not given you its result, ordering it is usually the answer.</li>
        <li><strong>Does treatment beat the test?</strong> Tension pneumothorax, anaphylaxis, meningitis, cord compression from cancer, a retrobulbar hemorrhage and a hemophilia joint bleed are all treated before anyone images them.</li>
        <li><strong>Which result is the fork?</strong> The stem usually hands you a number (a potassium, a pH, a score, a time since onset). The answer changes on which side of the line it falls.</li>
        <li><strong>Where is the trap?</strong> It is usually a contraindication (prasugrel after a stroke, AV nodal blockers in pre-excited AF, methylergonovine in hypertension) or a test that delays treatment.</li>
      </ol>

      <h2>Jump to a presentation</h2>
      <ul className="jump">
        {GROUPS.map((g) => (
          <Fragment key={g.title}>
            <li className="g">{g.title}</li>
            {g.items.map((p) => <li key={p.id}><a href={`#${p.id}`}>{p.name}</a></li>)}
          </Fragment>
        ))}
      </ul>

      {GROUPS.map((g, gi) => (
        <div key={g.title}>
          <h2>{g.title}</h2>
          {g.items.map((p) => <PresentationCard key={p.id} p={p} live={live} />)}
          {gi === 2 && (
            <section className="pitch">
              <div className="pk">The part between the algorithms</div>
              <div className="ph">You will see each of these as a vignette with several plausible answers.</div>
              <p className="ps">Step Gunner turns the chain into questions: which step comes next, which drug, which dose, which contraindication. Misses come back on a schedule until you get them right cold.</p>
              <div className="row">
                <a href={store} className="btn-store" onClick={storeClick('pitch_mid')}>Get Step Gunner free</a>
                <Link href="/research/nbme-to-step-2" className="btn-calc" onClick={() => track('cta_research', { surface: CAMPAIGN, location: 'pitch_mid' })}>What your NBME predicts</Link>
              </div>
            </section>
          )}
        </div>
      ))}

      <h2>Where the guidelines disagree, and what to answer</h2>
      <p>Building these from the source texts turned up places where two respected guidelines give different numbers. A question can only key one, so here is how to answer when you meet them.</p>
      <div className="tblwrap">
        <table className="tbl">
          <thead><tr><th>question</th><th>what the sources say</th><th>what to answer</th></tr></thead>
          <tbody>
            {DISAGREE.map((d) => (
              <tr key={d.topic}><td><b>{d.topic}</b></td><td>{d.sides}</td><td>{d.answer}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Frequently asked questions</h2>
      <div className="faq">
        {FAQ.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </div>

      <div className="cta">
        <a className="pri" href={store} onClick={storeClick('cta_bottom')}>Get Step Gunner free<small>next best step drills, spaced repetition</small></a>
        <Link className="sec" href="/readiness" onClick={() => track('cta_predictor', { surface: CAMPAIGN, location: 'cta_bottom' })}>Run the readiness check<small>free, with exam date and percentile</small></Link>
      </div>

      <h2>How this was built</h2>
      <p>Each presentation started as a full branching pathway: every result an ED workup can return, the patient who walks each branch, and the orders with their doses. Every dose, threshold and time window in those pathways was checked word for word against the source it cites (a guideline, a drug label or a named review), and then a second, independent pass went through each one trying to break it. Where the sources disagree, the pathway shows both sides instead of picking one quietly. This page condenses {ALL.length} of those pathways to the steps Step 2 CK asks about.</p>
      <p>Guidelines are named under each presentation. Where US and UK or European sources differ, the pathway records both; this page gives the answer the pathway keys and flags the split where a question could turn on it. This page is for exam preparation and is not clinical advice; real patients get local protocols and a senior.</p>
      </div>
    </LabLayout>
  );
}

// Which cards can link a full pathway: the articles this build publishes
// (lib/pathways/data's gate), slug to title.
export const getStaticProps: GetStaticProps = async () => ({
  props: { live: Object.fromEntries(publishedEntries().map((e) => [e.slug, e.pathway.title])) },
});
