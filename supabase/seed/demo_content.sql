-- Optional sample content so the portal is browsable before the job feed runs.
--
-- Everything here is marked source = 'demo'. Remove it in one line once real
-- listings are flowing:
--   delete from public.jobs where source = 'demo';

insert into public.jobs
  (source, source_id, title, company, location, is_remote, sector, employment_type,
   category, description, apply_url, salary_min, salary_max, salary_period,
   qualification, experience, tags, posted_at, deadline)
values
  ('demo','d1','Junior Software Engineer','Zoho','Chennai',false,'private','full_time',
   'Engineering',
   E'Work on product teams building web applications used by millions of small businesses.\n\nYou will:\n- Build and ship features in JavaScript and Java\n- Write tests and review peers'' code\n- Work directly with product managers on scope',
   'https://careers.zohocorp.com/', 600000, 900000, 'year',
   'B.E / B.Tech / MCA','0-2 years', ARRAY['engineering','fresher','chennai'],
   now() - interval '2 days', null),

  ('demo','d2','SSC Combined Graduate Level (CGL) 2026','Staff Selection Commission','All India',false,'government','full_time',
   'Government',
   E'Recruitment to Group B and Group C posts across central government ministries and departments.\n\nSelection is through Tier 1 and Tier 2 computer-based examinations followed by document verification.\n\nAlways read the official notification PDF before applying.',
   'https://ssc.gov.in/', 25500, 81100, 'month',
   'Bachelor''s degree in any discipline','Fresher', ARRAY['ssc','cgl','government','all india'],
   now() - interval '1 day', (current_date + 24)),

  ('demo','d3','Data Analyst','Swiggy','Bengaluru',false,'private','full_time',
   'Analytics',
   E'Join the supply analytics team working on delivery partner allocation.\n\nYou will build dashboards, run experiments and size opportunities for the operations team.',
   'https://careers.swiggy.com/', 1200000, 1800000, 'year',
   'Any graduate with strong SQL','1-3 years', ARRAY['analytics','sql','bengaluru'],
   now() - interval '4 days', null),

  ('demo','d4','IBPS Probationary Officer (PO) 2026','Institute of Banking Personnel Selection','All India',false,'government','full_time',
   'Banking',
   E'Common recruitment process for Probationary Officer and Management Trainee posts in participating public sector banks.\n\nPrelims, Mains and interview.',
   'https://www.ibps.in/', 48480, 85920, 'month',
   'Graduate in any discipline','Fresher', ARRAY['ibps','banking','po'],
   now() - interval '6 days', (current_date + 12)),

  ('demo','d5','Frontend Developer Intern','Razorpay','Remote',true,'internship','internship',
   'Engineering',
   E'Six-month internship with the merchant dashboard team.\n\nStipend paid monthly. Strong performers are offered a full-time role at the end.',
   'https://razorpay.com/jobs/', 40000, 60000, 'month',
   'Pre-final or final year student','Fresher', ARRAY['internship','react','remote'],
   now() - interval '3 hours', (current_date + 5)),

  ('demo','d6','Assistant Professor — Computer Science','University Grants Commission','Multiple states',false,'government','full_time',
   'Teaching',
   E'Recruitment of Assistant Professors in state universities and affiliated colleges.\n\nUGC NET or PhD required as per UGC regulations.',
   'https://www.ugc.gov.in/', 57700, 182400, 'month',
   'Master''s degree + NET/PhD','As per UGC norms', ARRAY['teaching','ugc','net'],
   now() - interval '9 days', (current_date + 40)),

  ('demo','d7','Graduate Engineer Trainee','Tata Motors','Pune',false,'private','full_time',
   'Core engineering',
   E'Two-year structured graduate programme rotating through design, manufacturing and quality.',
   'https://www.tatamotors.com/careers/', 550000, 750000, 'year',
   'B.E / B.Tech (Mechanical, Electrical, Production)','Fresher', ARRAY['core','get','pune','mechanical'],
   now() - interval '7 days', null),

  ('demo','d8','RRB NTPC — Non Technical Popular Categories','Railway Recruitment Board','All India',false,'government','full_time',
   'Railways',
   E'Recruitment for Station Master, Goods Guard, Clerk and other non-technical posts across railway zones.\n\nCBT 1, CBT 2, skill test and document verification.',
   'https://indianrailways.gov.in/', 19900, 35400, 'month',
   '12th pass / Graduate depending on post','Fresher', ARRAY['railway','rrb','ntpc'],
   now() - interval '12 hours', (current_date + 3)),

  ('demo','d9','Business Analyst','Deloitte India','Gurugram',false,'private','full_time',
   'Consulting',
   E'Work with client teams on process improvement and technology transformation engagements.',
   'https://www2.deloitte.com/in/en/careers.html', 900000, 1400000, 'year',
   'MBA or equivalent','0-3 years', ARRAY['consulting','analyst','gurugram'],
   now() - interval '5 days', null),

  ('demo','d10','Content Writing Intern','Unacademy','Remote',true,'internship','internship',
   'Content',
   E'Write and edit exam preparation content for competitive exam learners. Flexible hours, work from anywhere.',
   'https://unacademy.com/careers', 15000, 25000, 'month',
   'Any graduate or final year student','Fresher', ARRAY['internship','content','remote','writing'],
   now() - interval '1 day', (current_date + 9))
on conflict (source, source_id) do nothing;

-- A few starting entries that point at the official sources students should be
-- reading anyway. Real uploads go into the 'study' storage bucket instead.
insert into public.study_materials (category_id, title, description, kind, exam, external_url)
select c.id, v.title, v.description, v.kind, v.exam, v.url
from (values
  ('ssc-railway', 'SSC official notifications & syllabus', 'The Commission''s own site — always verify a notification here before applying.', 'link', 'SSC', 'https://ssc.gov.in/'),
  ('banking',     'IBPS official notifications',            'Common recruitment process calendars, notifications and results.',             'link', 'IBPS', 'https://www.ibps.in/'),
  ('upsc-state',  'UPSC official notifications & syllabus', 'Civil services notification, syllabus and previous question papers.',          'link', 'UPSC', 'https://www.upsc.gov.in/'),
  ('teaching',    'UGC NET information bulletin',           'Eligibility, syllabus and exam schedule from the UGC.',                        'link', 'UGC NET', 'https://www.ugc.gov.in/')
) as v(slug, title, description, kind, exam, url)
join public.study_categories c on c.slug = v.slug
on conflict do nothing;
