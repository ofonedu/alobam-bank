exports.id=821,exports.ids=[821],exports.modules={2235:(e,t,s)=>{"use strict";s.d(t,{FE:()=>y,J$:()=>m,Ns:()=>d,R3:()=>g,a0:()=>h,ii:()=>u,xk:()=>c,yD:()=>p});var o=s(91199);s(42087);var a=s(20055),r=s(37036),n=s(59652),i=s(7944),l=s(33331);async function c(e){let t=e.get("name"),s=e.get("description"),o=r.d_.safeParse({name:t,description:s});if(!o.success)return{success:!1,message:"Invalid form data.",error:o.error.flatten().fieldErrors};try{let e=(0,n.rJ)(a.db,"accountTypes"),t=await (0,n.gS)(e,{name:o.data.name,description:o.data.description||"",createdAt:n.Dc.now()});return(0,i.revalidatePath)("/admin/settings/account-types"),{success:!0,message:"Account type added successfully.",accountTypeId:t.id}}catch(e){return console.error("Error adding account type:",e),{success:!1,message:"Failed to add account type.",error:e.message}}}async function d(){try{let e=(0,n.rJ)(a.db,"accountTypes"),t=(0,n.P)(e,(0,n.My)("name","asc")),s=(await (0,n.GG)(t)).docs.map(e=>{let t;let s=e.data();return t=s.createdAt&&s.createdAt?.toDate?s.createdAt.toDate():s.createdAt instanceof Date?s.createdAt:new Date(s.createdAt||Date.now()),{id:e.id,name:s.name,description:s.description,createdAt:t}});return{success:!0,accountTypes:s}}catch(e){return console.error("Error fetching account types:",e),{success:!1,error:"Failed to fetch account types."}}}async function m(){try{let e=(0,n.H9)(a.db,"settings","platformConfig"),t=await (0,n.x7)(e);if(t.exists())return{success:!0,settings:t.data()};return{success:!0,settings:{platformName:"Wohana Funds",supportEmail:"support@example.com",maintenanceMode:!1,cotPercentage:.01,requireCOTConfirmation:!1,requireIMFAuthorization:!1,requireTaxClearance:!1,enableOtpForTransfers:!1,platformLogoText:"Wohana Funds",platformLogoIcon:"ShieldCheck",resendApiKey:"",resendFromEmail:""}}}catch(e){return console.error("Error fetching platform settings:",e),{success:!1,error:"Failed to fetch platform settings."}}}async function u(e){try{let t=(0,n.H9)(a.db,"settings","platformConfig");return await (0,n.BN)(t,e,{merge:!0}),(0,i.revalidatePath)("/admin/settings","layout"),(0,i.revalidatePath)("/","layout"),(void 0!==e.platformLogoText||void 0!==e.platformLogoIcon)&&(0,i.revalidatePath)("/components/layout/AppLogo","layout"),{success:!0,message:"Platform settings updated successfully."}}catch(e){return console.error("Error updating platform settings:",e),{success:!1,message:"Failed to update platform settings.",error:e.message}}}async function p(e,t){let s=t.get("name"),o=t.get("description"),l=r.d_.safeParse({name:s,description:o});if(!l.success)return{success:!1,message:"Invalid form data.",error:l.error.flatten().fieldErrors};try{let t=(0,n.H9)(a.db,"accountTypes",e);return await (0,n.mZ)(t,{name:l.data.name,description:l.data.description||""}),(0,i.revalidatePath)("/admin/settings/account-types"),{success:!0,message:"Account type updated successfully."}}catch(e){return console.error("Error updating account type:",e),{success:!1,message:"Failed to update account type.",error:e.message}}}async function g(e){try{let t=(0,n.H9)(a.db,"accountTypes",e);return await (0,n.kd)(t),(0,i.revalidatePath)("/admin/settings/account-types"),{success:!0,message:"Account type deleted successfully."}}catch(e){return console.error("Error deleting account type:",e),{success:!1,message:"Failed to delete account type.",error:e.message}}}async function h(){try{let e=(0,n.H9)(a.db,"landingPageConfig","main"),t=await (0,n.x7)(e);if(t.exists())return{success:!0,content:t.data()};return{success:!0,content:{}}}catch(e){return console.error("Error fetching landing page content:",e),{success:!1,error:"Failed to fetch landing page content."}}}let f={heroSection:r.R1,featuresOverview:r.Nd,accountOfferings:r.Dd,debitCardPromotion:r.pP,investmentOpportunities:r.Sr,loanMortgageServices:r.Od,customerFeedback:r.hI,finalCTA:r.Oc,headerNavLinks:r.$j,footerContent:r.w1};async function y(e,t){try{let s,o=t,l=e;if("headerNavLinks"===e){let e=r.$j.safeParse({navLinks:t});if(!e.success)return console.error("Validation failed for headerNavLinks:",e.error.flatten().fieldErrors),{success:!1,message:"Invalid header navigation data.",error:JSON.stringify(e.error.flatten().fieldErrors)};o=e.data.navLinks,l="headerNavLinks"}else if("footerContent"===e){let e=r.w1.safeParse(t);if(!e.success)return console.error("Validation failed for footerContent:",e.error.flatten().fieldErrors),{success:!1,message:"Invalid footer content data.",error:JSON.stringify(e.error.flatten().fieldErrors)};o=e.data}else{let s=f[e];if(s){let a=s.safeParse(t);if(!a.success)return console.error(`Validation failed for ${e}:`,a.error.flatten().fieldErrors),{success:!1,message:`Invalid ${e} data.`,error:JSON.stringify(a.error.flatten().fieldErrors)};o=a.data}}let c=(0,n.H9)(a.db,"landingPageConfig","main");s="headerNavLinks"===l?{headerNavLinks:o}:"footerContent"===l?{footerContent:o}:{[l]:o},await (0,n.BN)(c,s,{merge:!0}),(0,i.revalidatePath)("/"),(0,i.revalidatePath)("/admin/settings/landing-page");let d=e.charAt(0).toUpperCase()+e.slice(1).replace(/([A-Z])/g," $1");return{success:!0,message:`${d} updated successfully.`}}catch(t){return console.error(`Error updating landing page section ${e}:`,t),{success:!1,message:`Failed to update ${e}.`,error:t.message}}}(0,l.D)([c,d,m,u,p,g,h,y]),(0,o.A)(c,"405eb9911f33c3d30f855e4f5a1527a24f42e6c294",null),(0,o.A)(d,"00395e5e4b03385e5ff3a61827ff2eda7721f4e6fd",null),(0,o.A)(m,"000ba8576fdcae11f1077fd2f6107481a50b69a49c",null),(0,o.A)(u,"4020c28b5806231680bac26bd1a5f986057ba4604a",null),(0,o.A)(p,"60ff8321e9d694b897c700ee9ea58f57df8694f2ec",null),(0,o.A)(g,"407b998a89b103b17288a19e879fdbf57b42a451fa",null),(0,o.A)(h,"00d3b7c7cd72c85ee48ae24fb4ba855eb43cfee9e5",null),(0,o.A)(y,"60b1e2ff96f372e51b9fcb16237485e016caa935df",null)},4780:(e,t,s)=>{"use strict";s.d(t,{V:()=>p,cn:()=>r,v:()=>n});var o=s(49384),a=s(82348);function r(...e){return(0,a.QP)((0,o.$)(e))}function n(e,t){if(null==e)return"N/A";let s=t||"USD";try{return new Intl.NumberFormat(void 0,{style:"currency",currency:s,minimumFractionDigits:2,maximumFractionDigits:2}).format(e)}catch(t){return console.warn(`Failed to format currency with code ${s}:`,t),`${s} ${e.toFixed(2)} (Format Error)`}}let i=["John","Jane","Michael","Emily","David","Sarah","Chris","Jessica","James","Linda","Robert","Patricia","William","Jennifer","Richard","Mary","Charles","Susan","Joseph","Karen"],l=["Smith","Doe","Johnson","Williams","Brown","Davis","Miller","Wilson","Garcia","Rodriguez","Jones","Martinez","Taylor","Anderson","Thomas","Hernandez","Moore","Martin"],c=["Kenji","Sakura","Wei","Mei","Hiroshi","Yuki","Jin","Lien","Raj","Priya","Arjun","Ananya","Min-jun","Seo-yeon","Haruto","Aoi"],d=["Tanaka","Kim","Lee","Chen","Watanabe","Park","Nguyen","Singh","Gupta","Khan","Wang","Li","Zhang","Liu","Patel","Yamamoto"],m=["Hans","Sophie","Luca","Isabelle","Miguel","Clara","Pierre","Anna","Viktor","Elena","Giovanni","Maria","Jan","Eva","Liam","Olivia"],u=["M\xfcller","Dubois","Rossi","Garc\xeda","Silva","Jansen","Novak","Ivanov","Kowalski","Andersson","Schmidt","Martin","Fern\xe1ndez","Popescu"];function p(){let e,t;let s=Math.random();s<.33?(e=i,t=l):s<.66?(e=c,t=d):(e=m,t=u);let o=e[Math.floor(Math.random()*e.length)],a=t[Math.floor(Math.random()*t.length)];return`${o} ${a}`}},14947:(e,t,s)=>{"use strict";s.d(t,{Toaster:()=>y});var o=s(60687),a=s(29867),r=s(43210),n=s(47313),i=s(24224),l=s(78726),c=s(4780);let d=n.Kq,m=r.forwardRef(({className:e,...t},s)=>(0,o.jsx)(n.LM,{ref:s,className:(0,c.cn)("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",e),...t}));m.displayName=n.LM.displayName;let u=(0,i.F)("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",{variants:{variant:{default:"border bg-background text-foreground",destructive:"destructive group border-destructive bg-destructive text-destructive-foreground"}},defaultVariants:{variant:"default"}}),p=r.forwardRef(({className:e,variant:t,...s},a)=>(0,o.jsx)(n.bL,{ref:a,className:(0,c.cn)(u({variant:t}),e),...s}));p.displayName=n.bL.displayName,r.forwardRef(({className:e,...t},s)=>(0,o.jsx)(n.rc,{ref:s,className:(0,c.cn)("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",e),...t})).displayName=n.rc.displayName;let g=r.forwardRef(({className:e,...t},s)=>(0,o.jsx)(n.bm,{ref:s,className:(0,c.cn)("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",e),"toast-close":"",...t,children:(0,o.jsx)(l.A,{className:"h-4 w-4"})}));g.displayName=n.bm.displayName;let h=r.forwardRef(({className:e,...t},s)=>(0,o.jsx)(n.hE,{ref:s,className:(0,c.cn)("text-sm font-semibold",e),...t}));h.displayName=n.hE.displayName;let f=r.forwardRef(({className:e,...t},s)=>(0,o.jsx)(n.VY,{ref:s,className:(0,c.cn)("text-sm opacity-90",e),...t}));function y(){let{toasts:e}=(0,a.dj)();return(0,o.jsxs)(d,{children:[e.map(function({id:e,title:t,description:s,action:a,...r}){return(0,o.jsxs)(p,{...r,children:[(0,o.jsxs)("div",{className:"grid gap-1",children:[t&&(0,o.jsx)(h,{children:t}),s&&(0,o.jsx)(f,{children:s})]}),a,(0,o.jsx)(g,{})]},e)}),(0,o.jsx)(m,{})]})}f.displayName=n.VY.displayName},20055:(e,t,s)=>{"use strict";let o;s.d(t,{IG:()=>p,db:()=>u,j2:()=>m});var a=s(11988),r=s(37808),n=s(59652),i=s(12002);let l="AIzaSyDDSfTetLVLe0LwCB-070TnJCk0eL5keRg",c="alobam-bank.firebaseapp.com",d="alobam-bank";if(!l)throw Error("Firebase API Key is missing. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is set correctly in your .env file and that the development server was restarted.");if(!c)throw Error("Firebase Auth Domain is missing. Please ensure NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is set correctly in your .env file and that the development server was restarted.");d||console.warn("Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is not set. This might cause issues with some Firebase services."),o=(0,a.Dk)().length?(0,a.Sx)():(0,a.Wp)({apiKey:l,authDomain:c,projectId:d,storageBucket:"alobam-bank.firebasestorage.app",messagingSenderId:"21187336200",appId:"1:21187336200:web:83b0e0c311f5d9820219bd"});let m=(0,r.xI)(o),u=(0,n.aU)(o),p=(0,i.c7)(o)},21503:(e,t,s)=>{"use strict";s.d(t,{ThemeProvider:()=>r});var o=s(60687);s(43210);var a=s(10218);function r({children:e,...t}){return(0,o.jsx)(a.N,{attribute:"class",defaultTheme:"light",enableSystem:!1,disableTransitionOnChange:!0,...t,children:e})}},22141:(e,t,s)=>{"use strict";s.d(t,{J:()=>a});var o=s(6475);let a=(0,o.createServerReference)("000ba8576fdcae11f1077fd2f6107481a50b69a49c",o.callServer,void 0,o.findSourceMapURL,"getPlatformSettingsAction")},28513:(e,t,s)=>{Promise.resolve().then(s.bind(s,31669)),Promise.resolve().then(s.bind(s,79737)),Promise.resolve().then(s.bind(s,93670))},29867:(e,t,s)=>{"use strict";s.d(t,{dj:()=>u});var o=s(43210);let a=0,r=new Map,n=e=>{if(r.has(e))return;let t=setTimeout(()=>{r.delete(e),d({type:"REMOVE_TOAST",toastId:e})},1e6);r.set(e,t)},i=(e,t)=>{switch(t.type){case"ADD_TOAST":return{...e,toasts:[t.toast,...e.toasts].slice(0,1)};case"UPDATE_TOAST":return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case"DISMISS_TOAST":{let{toastId:s}=t;return s?n(s):e.toasts.forEach(e=>{n(e.id)}),{...e,toasts:e.toasts.map(e=>e.id===s||void 0===s?{...e,open:!1}:e)}}case"REMOVE_TOAST":if(void 0===t.toastId)return{...e,toasts:[]};return{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)}}},l=[],c={toasts:[]};function d(e){c=i(c,e),l.forEach(e=>{e(c)})}function m({...e}){let t=(a=(a+1)%Number.MAX_SAFE_INTEGER).toString(),s=()=>d({type:"DISMISS_TOAST",toastId:t});return d({type:"ADD_TOAST",toast:{...e,id:t,open:!0,onOpenChange:e=>{e||s()}}}),{id:t,dismiss:s,update:e=>d({type:"UPDATE_TOAST",toast:{...e,id:t}})}}function u(){let[e,t]=o.useState(c);return o.useEffect(()=>(l.push(t),()=>{let e=l.indexOf(t);e>-1&&l.splice(e,1)}),[e]),{...e,toast:m,dismiss:e=>d({type:"DISMISS_TOAST",toastId:e})}}},30677:(e,t,s)=>{"use strict";let o,a;s.d(t,{_:()=>E,u:()=>I});var r=s(91199);s(42087);var n=s(73547),i=s(2235);s(7153);let l="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;",c="max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);",d="text-align: center; padding-bottom: 25px; border-bottom: 1px solid #e0e0e0; margin-bottom: 25px;",m="font-size: 16px;",u="margin: 0 0 15px 0;",p="color: #002147;",g="text-align: center; margin: 25px 0;",h="display: inline-block; padding: 12px 25px; background-color: #FFD700; color: #002147; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; border:none; cursor: pointer;",f="color: #0056b3; text-decoration: underline;",y="text-transform: capitalize;";function b(e="Wohana Funds",t){if(t)return`<img src="${t}" alt="${e} Logo" style="max-height:50px; margin-bottom:10px; border:0;" />`;let s=e?e.charAt(0).toUpperCase():"WF";return`<div style="width:50px; height:50px; line-height:50px; text-align:center; background-color:#002147; color:#FFD700; font-size:24px; font-weight:bold; border-radius:50%; margin:0 auto 10px auto;">${s}</div><span style="font-size:24px;font-weight:bold;color:#002147;line-height:1.2;">${e}</span>`}function v(e="Wohana Funds",t){let s=t||`support@${e.toLowerCase().replace(/\s+/g,"")}.com`;return`
    <div style="text-align: center; padding-top: 25px; border-top: 1px solid #e0e0e0; margin-top: 25px; font-size: 12px; color: #888888;">
      <p>&copy; ${new Date().getFullYear()} ${e}. All rights reserved.</p>
      <p>123 Wohana Street, Finance City, FC 12345</p>
      <p>If you have questions, contact support at <a href="mailto:${s}" style="${f}">${s}</a>.</p>
    </div>
  `}var $=s(33331);let w=null,x=null,z=null,T=!1;async function A(){if(T&&w&&x&&z)return console.log("Resend client already initialized and essential settings are present."),!0;console.log("Attempting to initialize Resend client...");try{let e=await (0,i.J$)();if(!e.success||!e.settings)return console.error("Resend client initialization FAILED: Could not retrieve platform settings.",e.error),T=!1,w=null,x=null,z="Wohana Funds",o=void 0,a=void 0,!1;{let t=e.settings.resendApiKey,s=e.settings.resendFromEmail,r=e.settings.platformName;if(o=e.settings.emailLogoImageUrl,a=e.settings.supportEmail,!t)return console.error("Resend client initialization FAILED: Resend API Key is MISSING from settings."),T=!1,w=null,x=null,z=r||"Wohana Funds",!1;if(!s)return console.error("Resend client initialization FAILED: Resend From Email is MISSING from settings."),T=!1,w=null,x=null,z=r||"Wohana Funds",!1;return r?z=r:(console.warn("Resend client initialization WARNING: Platform Name is MISSING from settings. Using default 'Wohana Funds' for email display name."),z="Wohana Funds"),w=new n.u(t),x=s,T=!0,console.log(`Resend client initialized successfully. From Email: ${x}, Platform Name: ${z}, Email Logo: ${o||"Not set"}, Support Email for Footer: ${a||"Not set"}`),!0}}catch(e){return console.error("Resend client initialization EXCEPTION:",e),T=!1,w=null,x=null,z="Wohana Funds",o=void 0,a=void 0,!1}}async function I({to:e,subject:t,htmlBody:s,textBody:o}){if(console.log("sendTransactionalEmail: Called."),!await A()||!w||!x||!z){let e="Resend client is not properly initialized or essential settings (API Key, From Email, Platform Name) are missing. Email sending aborted. Please check admin settings and server logs.";return console.error(`sendTransactionalEmail: Initialization check failed: ${e}`),{success:!1,message:"Failed to send email: Email service not correctly configured.",error:e}}if(console.log(`sendTransactionalEmail: Client initialized. From: ${x}, Platform Name: ${z}`),!s||"string"!=typeof s||""===s.trim()||s.trim().toLowerCase().startsWith("<!doctype html public")){let e=`sendTransactionalEmail: CRITICAL - HTML body is empty, invalid, or only a DOCTYPE. This indicates a problem with email template generation. HTML received (first 100 chars): "${s?s.substring(0,100)+"...":"NULL or EMPTY"}"`;return console.error(e),{success:!1,message:"Failed to send email: Email content generation failed (HTML body was empty or invalid).",error:e}}console.log("sendTransactionalEmail: Valid HTML body received (first 200 chars):",s.substring(0,200)+"...");let a=`${z} <${x}>`;console.log(`sendTransactionalEmail: Constructed 'From' field for Resend: ${a}`);let r={from:a,to:[e],subject:t,html:s,text:o||t};console.log("sendTransactionalEmail: Payload being sent to Resend (HTML/Text truncated):",JSON.stringify(r,(e,t)=>("html"===e||"text"===e)&&"string"==typeof t?t.substring(0,100)+"...":t));try{console.log(`sendTransactionalEmail: Attempting to send email via Resend: To: ${e}, Subject: "${t}", From: ${a}`);let{data:s,error:o}=await w.emails.send(r);if(o)return console.error(`sendTransactionalEmail: Resend API Error: Name: ${o.name}, Message: ${o.message}. Full Error:`,JSON.stringify(o)),{success:!1,message:`Failed to send email via Resend API: ${o.name} - ${o.message}`,error:JSON.stringify(o)};return console.log("sendTransactionalEmail: Email sent successfully via Resend. ID:",s?.id),{success:!0,message:"Email sent successfully."}}catch(e){return console.error("sendTransactionalEmail: Exception during resend.emails.send():",JSON.stringify(e,Object.getOwnPropertyNames(e))),{success:!1,message:`An unexpected error occurred while sending email: ${e.message||"Unknown exception"}`,error:JSON.stringify(e,Object.getOwnPropertyNames(e))}}}async function E(e,t){console.log(`getEmailTemplateAndSubject: Called with emailType: "${e}"`),T||(console.log("getEmailTemplateAndSubject: Resend client not initialized, attempting initialization for template data..."),await A());let s=z||"Wohana Funds",r=o,n=a,i={...t,bankName:s,emailLogoImageUrl:r,supportEmail:n};console.log("getEmailTemplateAndSubject: Payload for template function:",i);let $=null,w=`Notification from ${s}`;try{switch(e){case"WELCOME":w=`Welcome to ${s}!`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,accountNumber:o="N/A",loginUrl:a="#",supportEmail:r}){let n=b(t,s),i=v(t,r);return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${n}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">Welcome, <span style="${y}">${e}</span>!</p>
      <p style="${u}">We're excited to have you on board with <strong style="${p}">${t}</strong>.</p>
      <p style="${u}">Your account has been successfully created. Your account number is <strong style="${p}">${o}</strong>.</p>
      <div style="${g}">
        <a href="${a}" style="${h}">Log In to Your Account</a>
      </div>
      <p style="${u}">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p style="${u}">Thanks for choosing <strong style="${p}">${t}</strong>.</p>
      <p style="${u}">Best regards,<br>The ${t} Team</p>
    </div>
    ${i}
  </div>
</body>
</html>
  `}(i);break;case"KYC_SUBMITTED":w=`KYC Submission Received - ${s}`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,kycSubmissionDate:o,loginUrl:a="#",supportEmail:r}){let n=b(t,s),i=v(t,r),f=o?new Date(o).toLocaleDateString():"recently";return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Submission Received - ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${n}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">Dear <span style="${y}">${e}</span>,</p>
      <p style="${u}">We have successfully received your KYC (Know Your Customer) documents submitted on <strong style="${p}">${f}</strong>.</p>
      <p style="${u}">Your submission is now under review by our team. This process typically takes 1-3 business days. We will notify you via email as soon as your KYC status is updated.</p>
      <p style="${u}">You can check your KYC status by logging into your account:</p>
      <div style="${g}">
        <a href="${a}" style="${h}">View KYC Status</a>
      </div>
      <p style="${u}">Thank you for your cooperation in helping us maintain a secure platform.</p>
      <p style="${u}">Best regards,<br>The ${t} Team</p>
    </div>
    ${i}
  </div>
</body>
</html>
  `}(i);break;case"KYC_APPROVED":w=`KYC Approved! - ${s}`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,loginUrl:o="#",supportEmail:a}){let r=b(t,s),n=v(t,a);return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Approved! - ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${r}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">Congratulations, <span style="${y}">${e}</span>!</p>
      <p style="${u}">Your KYC (Know Your Customer) verification has been <strong style="color:green;">APPROVED</strong>.</p>
      <p style="${u}">You now have full access to all features and services offered by <strong style="${p}">${t}</strong>.</p>
      <p style="${u}">Thank you for completing the verification process.</p>
      <div style="${g}">
        <a href="${o}" style="${h}">Access Your Account</a>
      </div>
      <p style="${u}">Best regards,<br>The ${t} Team</p>
    </div>
    ${n}
  </div>
</body>
</html>
  `}(i);break;case"KYC_REJECTED":w=`KYC Submission Update - ${s}`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,kycRejectionReason:o="Please review your submission and ensure all information is accurate and documents are clear.",loginUrl:a="#",supportEmail:r}){let n=b(t,s),i=v(t,r);return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KYC Submission Update - ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${n}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">Dear <span style="${y}">${e}</span>,</p>
      <p style="${u}">We have reviewed your KYC (Know Your Customer) submission and unfortunately, it could not be approved at this time. Your KYC status has been marked as <strong style="color:red;">REJECTED</strong>.</p>
      <p style="${u}"><strong style="${p}">Reason for rejection:</strong> ${o}</p>
      <p style="${u}">Please review the feedback, make any necessary corrections, and resubmit your KYC information through your account dashboard.</p>
      <div style="${g}">
        <a href="${a}" style="${h}">Resubmit KYC Information</a>
      </div>
      <p style="${u}">If you have any questions or believe this is an error, please contact our support team.</p>
      <p style="${u}">Best regards,<br>The ${t} Team</p>
    </div>
    ${i}
  </div>
</body>
</html>
  `}(i);break;case"ADMIN_KYC_SUBMITTED":w=`New KYC Submission Requires Review - ${s}`,$=function({fullName:e="N/A",userId:t="N/A",bankName:s="Wohana Funds",emailLogoImageUrl:o,kycSubmissionDate:a,adminReviewUrl:r="#",supportEmail:n}){let i=b(s,o),f=v(s,n),$=a?new Date(a).toLocaleDateString():"recently";return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New KYC Submission - ${s} Admin</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${i}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">Admin Notification: New KYC Submission</p>
      <p style="${u}">A new KYC submission has been received and requires your review.</p>
      <p style="${u}"><strong style="${p}">User Name:</strong> <span style="${y}">${e}</span></p>
      <p style="${u}"><strong style="${p}">User ID:</strong> ${t}</p>
      <p style="${u}"><strong style="${p}">Submission Date:</strong> ${$}</p>
      <div style="${g}">
        <a href="${r}" style="${h}">Review Submission</a>
      </div>
      <p style="${u}">Please log in to the admin panel to review the details and take appropriate action.</p>
      <p style="${u}">Thank you,<br>The ${s} System</p>
    </div>
    ${f}
  </div>
</body>
</html>
  `}(i);break;case"DEBIT_NOTIFICATION":w=`Debit Transaction Alert - ${s}`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,transactionAmount:o,transactionType:a,transactionDate:r,transactionId:n,transactionDescription:i,recipientName:f,currentBalance:$,loginUrl:w="#",supportEmail:x}){let z=b(t,s),T=v(t,x),A=r?new Date(r).toLocaleString():"Recently";return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debit Notification - ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${z}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">Debit Transaction Alert</p>
      <p style="${u}">Dear <span style="${y}">${e}</span>,</p>
      <p style="${u}">This email confirms that a debit transaction has occurred on your account:</p>
      <ul style="list-style-type: none; padding-left: 0;">
        <li style="${u}"><strong style="${p}">Amount:</strong> <span style="color: #D32F2F; font-weight:bold;">${o||"N/A"}</span></li>
        <li style="${u}"><strong style="${p}">Type:</strong> ${a||"N/A"}</li>
        <li style="${u}"><strong style="${p}">Date:</strong> ${A}</li>
        ${i?`<li style="${u}"><strong style="${p}">Description:</strong> ${i}</li>`:""}
        ${f?`<li style="${u}"><strong style="${p}">Recipient:</strong> ${f}</li>`:""}
        <li style="${u}"><strong style="${p}">Transaction ID:</strong> ${n||"N/A"}</li>
      </ul>
      <p style="${u}">Your new account balance is <strong style="${p}">${$||"N/A"}</strong>.</p>
      <p style="${u}">If you did not authorize this transaction, please contact our support team immediately.</p>
      <div style="${g}">
        <a href="${w}" style="${h}">View Account Activity</a>
      </div>
      <p style="${u}">Best regards,<br>The ${t} Team</p>
    </div>
    ${T}
  </div>
</body>
</html>
  `}(i);break;case"CREDIT_NOTIFICATION":w=`Credit Transaction Alert - ${s}`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,transactionAmount:o,transactionType:a,transactionDate:r,transactionId:n,transactionDescription:i,currentBalance:f,loginUrl:$="#",supportEmail:w}){let x=b(t,s),z=v(t,w),T=r?new Date(r).toLocaleString():"Recently";return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Credit Notification - ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${x}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">Credit Transaction Alert</p>
      <p style="${u}">Dear <span style="${y}">${e}</span>,</p>
      <p style="${u}">This email confirms that a credit transaction has occurred on your account:</p>
      <ul style="list-style-type: none; padding-left: 0;">
        <li style="${u}"><strong style="${p}">Amount:</strong> <span style="color: #388E3C; font-weight:bold;">${o||"N/A"}</span></li>
        <li style="${u}"><strong style="${p}">Type:</strong> ${a||"N/A"}</li>
        <li style="${u}"><strong style="${p}">Date:</strong> ${T}</li>
        ${i?`<li style="${u}"><strong style="${p}">Description:</strong> ${i}</li>`:""}
        <li style="${u}"><strong style="${p}">Transaction ID:</strong> ${n||"N/A"}</li>
      </ul>
      <p style="${u}">Your new account balance is <strong style="${p}">${f||"N/A"}</strong>.</p>
      <div style="${g}">
        <a href="${$}" style="${h}">View Account Activity</a>
      </div>
      <p style="${u}">Best regards,<br>The ${t} Team</p>
    </div>
    ${z}
  </div>
</body>
</html>
  `}(i);break;case"PASSWORD_CHANGED":w=`Password Changed Successfully - ${s}`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,passwordChangedDate:o,loginUrl:a="#",supportEmail:r}){let n=b(t,s),i=v(t,r),$=o?new Date(o).toLocaleString():"Recently";return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully - ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${n}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">Password Change Confirmation</p>
      <p style="${u}">Dear <span style="${y}">${e}</span>,</p>
      <p style="${u}">This email confirms that the password for your <strong style="${p}">${t}</strong> account was successfully changed on <strong style="${p}">${$}</strong>.</p>
      <p style="${u}">If you did not make this change, please contact our support team immediately at <a href="mailto:${r||"support@example.com"}" style="${f}">${r||"support@example.com"}</a> or by replying to this email.</p>
      <p style="${u}">If you made this change, no further action is required.</p>
      <div style="${g}">
        <a href="${a}" style="${h}">Log In to Your Account</a>
      </div>
      <p style="${u}">Best regards,<br>The ${t} Team</p>
    </div>
    ${i}
  </div>
</body>
</html>
  `}(i);break;case"OTP_VERIFICATION":w=`Your One-Time Password (OTP) for ${s}`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,otp:o,supportEmail:a}){let r=b(t,s),n=v(t,a);return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your One-Time Password (OTP) - ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${r}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#002147;">One-Time Password (OTP) Verification</p>
      <p style="${u}">Dear <span style="${y}">${e}</span>,</p>
      <p style="${u}">Your One-Time Password (OTP) for completing your transaction/action with <strong style="${p}">${t}</strong> is:</p>
      <div style="text-align:center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #002147; letter-spacing: 2px; margin: 10px 0; padding: 10px; background-color: #f0f0f0; border-radius: 5px; display: inline-block;">${o||"N/A"}</span>
      </div>
      <p style="${u}">This OTP is valid for a short period (typically 5-10 minutes). Please do not share this code with anyone.</p>
      <p style="${u}">If you did not request this OTP, please contact our support team immediately at <a href="mailto:${a||"support@example.com"}" style="${f}">${a||"support@example.com"}</a>.</p>
      <p style="${u}">Best regards,<br>The ${t} Team</p>
    </div>
    ${n}
  </div>
</body>
</html>
  `}(i);break;case"ACCOUNT_SUSPENDED":w=`Important: Your Account Has Been Suspended - ${s}`,$=function({fullName:e="Valued Customer",bankName:t="Wohana Funds",emailLogoImageUrl:s,suspensionReason:o,supportEmail:a,loginUrl:r="#"}){let n=b(t,s),i=v(t,a),$=a||`support@${t.toLowerCase().replace(/\s+/g,"")}.com`;return`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Important: Your Account Has Been Suspended - ${t}</title>
</head>
<body style="${l}">
  <div style="${c}">
    <div style="${d}">
      ${n}
    </div>
    <div style="${m}">
      <p style="${u} font-size:18px; font-weight:bold; color:#D32F2F;">Account Suspension Notice</p>
      <p style="${u}">Dear <span style="${y}">${e}</span>,</p>
      <p style="${u}">We are writing to inform you that your account with <strong style="${p}">${t}</strong> has been temporarily suspended.</p>
      ${o?`<p style="${u}">Reason for suspension: ${o}</p>`:""}
      <p style="${u}">During this suspension, your access to certain services may be restricted. We understand this may cause inconvenience and we appreciate your understanding.</p>
      <p style="${u}">To learn more about this suspension or to seek resolution, please contact our support team immediately at <a href="mailto:${$}" style="${f}">${$}</a>.</p>
      <p style="${u}">You may still be able to log in to view your account status or basic information:</p>
      <div style="${g}">
        <a href="${r}" style="${h}">Log In to Your Account</a>
      </div>
      <p style="${u}">We are committed to resolving this matter with you. Please reach out to our support team at your earliest convenience.</p>
      <p style="${u}">Sincerely,<br>The ${t} Team</p>
    </div>
    ${i}
  </div>
</body>
</html>
  `}(i);break;default:console.warn(`getEmailTemplateAndSubject: No specific HTML template defined for email type: ${e}. Using basic fallback.`),$=`<p>This is a generic notification from ${s}.</p><p>Details: ${JSON.stringify(t)}</p>`}}catch(t){console.error(`getEmailTemplateAndSubject: Error generating HTML for email type ${e}:`,t.message,JSON.stringify(t,Object.getOwnPropertyNames(t))),$=`<p>Error generating email content. Please contact support. Type: ${e}</p>`,w=`Important Notification from ${s}`}return console.log(`getEmailTemplateAndSubject: Generated HTML Content for type "${e}" (first 200 chars):`,$?$.substring(0,200)+"...":"HTML content is null/empty"),{subject:w,html:$}}(0,$.D)([I,E]),(0,r.A)(I,"4034cc97d27439f4c059c8a95b03da6fa61b86b0db",null),(0,r.A)(E,"604312656f2004c1bcb55da4e8d649d32b089bca51",null)},30816:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,86346,23)),Promise.resolve().then(s.t.bind(s,27924,23)),Promise.resolve().then(s.t.bind(s,35656,23)),Promise.resolve().then(s.t.bind(s,40099,23)),Promise.resolve().then(s.t.bind(s,38243,23)),Promise.resolve().then(s.t.bind(s,28827,23)),Promise.resolve().then(s.t.bind(s,62763,23)),Promise.resolve().then(s.t.bind(s,97173,23))},31669:(e,t,s)=>{"use strict";s.d(t,{ThemeProvider:()=>o});let o=(0,s(12907).registerClientReference)(function(){throw Error("Attempted to call ThemeProvider() from the server but ThemeProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/george/Desktop/projects/alobam-bank/src/components/layout/ThemeProvider.tsx","ThemeProvider")},33784:(e,t,s)=>{"use strict";let o;s.d(t,{db:()=>u,j2:()=>m});var a=s(67989),r=s(7828),n=s(75535),i=s(70146);let l="AIzaSyDDSfTetLVLe0LwCB-070TnJCk0eL5keRg",c="alobam-bank.firebaseapp.com",d="alobam-bank";if(!l)throw Error("Firebase API Key is missing. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is set correctly in your .env file and that the development server was restarted.");if(!c)throw Error("Firebase Auth Domain is missing. Please ensure NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is set correctly in your .env file and that the development server was restarted.");d||console.warn("Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is not set. This might cause issues with some Firebase services."),o=(0,a.Dk)().length?(0,a.Sx)():(0,a.Wp)({apiKey:l,authDomain:c,projectId:d,storageBucket:"alobam-bank.firebasestorage.app",messagingSenderId:"21187336200",appId:"1:21187336200:web:83b0e0c311f5d9820219bd"});let m=(0,r.xI)(o),u=(0,n.aU)(o);(0,i.c7)(o)},37036:(e,t,s)=>{"use strict";s.d(t,{$4:()=>m,$j:()=>z,Dd:()=>f,Ih:()=>n,Nd:()=>g,Nt:()=>l,Oc:()=>w,Od:()=>v,QF:()=>c,R1:()=>u,Sr:()=>b,bw:()=>a,d_:()=>d,hI:()=>$,pP:()=>y,vR:()=>r,w1:()=>I});var o=s(68567);o.z.object({email:o.z.string().email({message:"Invalid email address."}),password:o.z.string().min(6,{message:"Password must be at least 6 characters."})}),o.z.object({firstName:o.z.string().min(2,"First name must be at least 2 characters."),lastName:o.z.string().min(2,"Last name must be at least 2 characters."),email:o.z.string().email({message:"Invalid email address."}),password:o.z.string().min(8,"Password must be at least 8 characters."),phoneNumber:o.z.string().min(10,"Phone number seems too short.").optional().or(o.z.literal("")),accountType:o.z.string().min(1,"Account type is required."),currency:o.z.string().min(3,"Currency code is required.").default("USD")});let a=o.z.object({firstName:o.z.string().min(2,"First name must be at least 2 characters."),lastName:o.z.string().min(2,"Last name must be at least 2 characters."),email:o.z.string().email({message:"Invalid email address."}),password:o.z.string().min(8,"Password must be at least 8 characters."),phoneNumber:o.z.string().min(10,"Phone number seems too short.").optional().or(o.z.literal("")),accountType:o.z.string().min(1,"Account type is required."),currency:o.z.string().min(3,"Currency code is required.").default("USD"),role:o.z.enum(["user","admin"],{required_error:"Role is required."})}),r=o.z.object({firstName:o.z.string().min(2,"First name must be at least 2 characters."),lastName:o.z.string().min(2,"Last name must be at least 2 characters."),phoneNumber:o.z.string().min(10,"Phone number is invalid.").optional().or(o.z.literal(""))});o.z.object({currentPassword:o.z.string().min(1,"Current password is required."),newPassword:o.z.string().min(8,"New password must be at least 8 characters."),confirmPassword:o.z.string().min(8,"Confirm password must be at least 8 characters.")}).refine(e=>e.newPassword===e.confirmPassword,{message:"New passwords do not match.",path:["confirmPassword"]});let n=o.z.object({email:o.z.string().email({message:"Please enter a valid email address."})}),i=["image/jpeg","image/jpg","image/png","image/webp"],l=o.z.object({fullName:o.z.string().min(2,{message:"Full name must be at least 2 characters."}),dateOfBirth:o.z.string().regex(/^\d{4}-\d{2}-\d{2}$/,{message:"Date of birth must be in YYYY-MM-DD format."}),address:o.z.string().min(5,{message:"Address must be at least 5 characters."}),governmentId:o.z.string().min(5,{message:"Government ID must be at least 5 characters."}),governmentIdPhoto:o.z.any().refine(e=>e?.length==1,"Government ID photo is required.").refine(e=>e?.[0]?.size<=5242880,"Max file size is 5MB.").refine(e=>i.includes(e?.[0]?.type),".jpg, .jpeg, .png and .webp files are accepted.")}),c=o.z.object({amount:o.z.number().min(100,"Minimum loan amount is $100.").max(1e5,"Maximum loan amount is $100,000."),termMonths:o.z.number().min(3,"Minimum term is 3 months.").max(60,"Maximum term is 60 months."),purpose:o.z.string().min(10,"Please provide a brief purpose for the loan (min 10 characters).")});o.z.object({description:o.z.string().min(3,"Description is too short."),amount:o.z.number().positive("Amount must be positive."),type:o.z.enum(["deposit","withdrawal"]),date:o.z.date()}),o.z.object({recipientName:o.z.string().min(2,"Recipient name must be at least 2 characters."),recipientAccountNumber:o.z.string().min(5,"Account number must be at least 5 characters."),bankName:o.z.string().min(3,"Bank name must be at least 3 characters.").optional(),routingNumber:o.z.string().min(8,"Routing number must be at least 8 characters.").max(12,"Routing number is too long."),amount:o.z.coerce.number().positive({message:"Amount must be positive."}),remarks:o.z.string().max(100,"Remarks cannot exceed 100 characters.").optional()}),o.z.object({recipientName:o.z.string().min(2,"Recipient name must be at least 2 characters."),recipientAccountNumberIBAN:o.z.string().min(15,"Account number/IBAN seems too short.").max(34,"Account number/IBAN seems too long."),bankName:o.z.string().min(3,"Bank name must be at least 3 characters."),swiftBic:o.z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,"Invalid SWIFT/BIC code format.").optional().or(o.z.literal("")),recipientBankAddress:o.z.string().min(5,"Bank address is too short.").optional(),country:o.z.string().min(2,"Country selection is required.").optional().or(o.z.literal("")),amount:o.z.coerce.number().positive({message:"Amount must be positive."}),currency:o.z.string().default("USD"),remarks:o.z.string().max(100,"Remarks cannot exceed 100 characters.").optional()});let d=o.z.object({name:o.z.string().min(2,"Account type name must be at least 2 characters."),description:o.z.string().max(200,"Description cannot exceed 200 characters.").optional()}),m=o.z.object({subject:o.z.string().min(5,"Subject must be at least 5 characters.").max(100,"Subject cannot exceed 100 characters."),message:o.z.string().min(20,"Message must be at least 20 characters.").max(2e3,"Message cannot exceed 2000 characters.")});o.z.object({platformName:o.z.string().min(1,"Platform name is required.").optional(),supportEmail:o.z.string().email("Invalid email address.").optional(),maintenanceMode:o.z.boolean().optional(),cotPercentage:o.z.coerce.number().min(0,"COT percentage cannot be negative.").max(100,"COT percentage cannot exceed 100.").optional(),requireCOTConfirmation:o.z.boolean().optional(),requireIMFAuthorization:o.z.boolean().optional(),requireTaxClearance:o.z.boolean().optional(),enableOtpForTransfers:o.z.boolean().optional(),platformLogoText:o.z.string().min(1,"Logo text cannot be empty if provided.").max(30,"Logo text too long.").optional().or(o.z.literal("")),platformLogoIcon:o.z.string().min(1,"Icon name cannot be empty if provided.").max(50,"Icon name too long.").optional().or(o.z.literal("")),emailLogoImageUrl:o.z.string().url("Invalid URL for email logo image.").or(o.z.string().startsWith("/",{message:"Local image URL must start with /"})).optional().or(o.z.literal("")),resendApiKey:o.z.string().min(1,"Resend API Key is required if Resend is enabled.").optional().or(o.z.literal("")),resendFromEmail:o.z.string().email("Invalid 'From' email address for Resend.").optional().or(o.z.literal(""))}),o.z.object({autoApproveKycRiskLevel:o.z.enum(["low","medium","high","none"]).optional(),aiKycEnabled:o.z.boolean().optional()}),o.z.object({maxLoanAmount:o.z.coerce.number().positive("Max loan amount must be positive.").optional(),defaultInterestRate:o.z.coerce.number().min(0).max(1,"Interest rate must be between 0 and 1 (e.g., 0.05 for 5%)").optional()});let u=o.z.object({headline:o.z.string().min(5,"Headline is too short.").max(100,"Headline is too long."),subheading:o.z.string().min(10,"Subheading is too short.").max(200,"Subheading is too long."),ctaButtonText:o.z.string().min(3,"Button text is too short.").max(30,"Button text is too long."),learnMoreLink:o.z.string().url({message:"Invalid URL for learn more link."}).or(o.z.string().startsWith("#")).optional().or(o.z.literal("")),imageUrl:o.z.string().url({message:"Invalid image URL."}).or(o.z.string().startsWith("/images/")).optional().or(o.z.literal("")),imageAlt:o.z.string().min(3,"Image alt text is too short.").max(100,"Image alt text is too long.").optional().or(o.z.literal(""))}),p=o.z.object({icon:o.z.string().min(1,"Icon name is required.").max(50,"Icon name too long."),title:o.z.string().min(3,"Feature title is too short.").max(50,"Feature title is too long."),description:o.z.string().min(10,"Feature description is too short.").max(150,"Feature description is too long.")}),g=o.z.object({headline:o.z.string().min(5,"Headline is too short.").max(100,"Headline is too long.").optional().or(o.z.literal("")),subheading:o.z.string().min(10,"Subheading is too short.").max(200,"Subheading is too long.").optional().or(o.z.literal("")),features:o.z.array(p).optional()}),h=o.z.object({icon:o.z.string().min(1,"Icon name is required.").max(50,"Icon name too long."),name:o.z.string().min(3,"Account name is too short.").max(50,"Account name is too long."),description:o.z.string().min(10,"Account description is too short.").max(150,"Account description is too long."),features:o.z.array(o.z.string().min(3,"Feature text is too short.").max(100,"Feature text is too long.")).optional(),learnMoreLink:o.z.string().url({message:"Invalid URL."}).or(o.z.string().startsWith("#")).optional().or(o.z.literal(""))}),f=o.z.object({headline:o.z.string().min(5,"Headline is too short.").max(100,"Headline is too long.").optional().or(o.z.literal("")),subheading:o.z.string().min(10,"Subheading is too short.").max(200,"Subheading is too long.").optional().or(o.z.literal("")),accounts:o.z.array(h).optional()}),y=o.z.object({headline:o.z.string().min(5,"Headline is too short.").max(100,"Headline is too long."),description:o.z.string().min(10,"Description is too short.").max(250,"Description is too long."),imageUrl:o.z.string().url({message:"Invalid image URL."}).or(o.z.string().startsWith("/images/")).optional().or(o.z.literal("")),imageAlt:o.z.string().min(3,"Image alt text is too short.").max(100,"Image alt text is too long.").optional().or(o.z.literal("")),ctaButtonText:o.z.string().min(3,"Button text is too short.").max(30,"Button text is too long."),ctaButtonLink:o.z.string().url({message:"Invalid URL for button link."}).or(o.z.string().startsWith("#")).optional().or(o.z.literal(""))}),b=o.z.object({headline:o.z.string().min(5,"Headline is too short.").max(100,"Headline is too long."),description:o.z.string().min(10,"Description is too short.").max(250,"Description is too long."),ctaButtonText:o.z.string().min(3,"Button text is too short.").max(30,"Button text is too long."),ctaButtonLink:o.z.string().url({message:"Invalid URL for button link."}).or(o.z.string().startsWith("#")).optional().or(o.z.literal("")),imageUrl:o.z.string().url({message:"Invalid image URL."}).or(o.z.string().startsWith("/images/")).optional().or(o.z.literal("")),imageAlt:o.z.string().min(3,"Image alt text is too short.").max(100,"Image alt text is too long.").optional().or(o.z.literal(""))}),v=o.z.object({headline:o.z.string().min(5,"Headline is too short.").max(100,"Headline is too long."),description:o.z.string().min(10,"Description is too short.").max(250,"Description is too long."),ctaButtonText:o.z.string().min(3,"Button text is too short.").max(30,"Button text is too long."),ctaButtonLink:o.z.string().url({message:"Invalid URL for button link."}).or(o.z.string().startsWith("#")).optional().or(o.z.literal("")),imageUrl:o.z.string().url({message:"Invalid image URL."}).or(o.z.string().startsWith("/images/")).optional().or(o.z.literal("")),imageAlt:o.z.string().min(3,"Image alt text is too short.").max(100,"Image alt text is too long.").optional().or(o.z.literal(""))}),$=o.z.object({headline:o.z.string().min(5,"Headline is too short.").max(100,"Headline is too long."),ctaButtonText:o.z.string().min(3,"Button text is too short.").max(30,"Button text is too long."),ctaButtonLink:o.z.string().url({message:"Invalid URL for button link."}).or(o.z.string().startsWith("#")).optional().or(o.z.literal(""))}),w=o.z.object({headline:o.z.string().min(5,"Headline is too short.").max(100,"Headline is too long."),subheading:o.z.string().min(10,"Subheading is too short.").max(200,"Subheading is too long."),ctaButtonText:o.z.string().min(3,"Button text is too short.").max(30,"Button text is too long."),ctaButtonLink:o.z.string().url({message:"Invalid URL for button link."}).or(o.z.string().startsWith("#")).optional().or(o.z.literal(""))}),x=o.z.object({label:o.z.string().min(1,"Link label is required.").max(30,"Link label is too long."),href:o.z.string().min(1,"Link URL/path is required.").max(200,"Link URL is too long.")}),z=o.z.object({navLinks:o.z.array(x).optional()}),T=o.z.object({title:o.z.string().min(1,"Column title is required.").max(50,"Column title is too long."),links:o.z.array(x).optional()}),A=o.z.object({platform:o.z.string().min(1,"Platform name is required.").max(50,"Platform name too long."),href:o.z.string().url({message:"Invalid URL for social media link."}),iconName:o.z.string().min(1,"Icon name is required.").max(50,"Icon name too long.").optional().or(o.z.literal(""))}),I=o.z.object({footerDescription:o.z.string().max(300,"Description is too long.").optional().or(o.z.literal("")),footerCopyright:o.z.string().max(150,"Copyright text is too long.").optional().or(o.z.literal("")),footerQuickLinkColumns:o.z.array(T).optional(),footerSocialMediaLinks:o.z.array(A).optional()})},61135:()=>{},64961:(e,t,s)=>{Promise.resolve().then(s.bind(s,21503)),Promise.resolve().then(s.bind(s,14947)),Promise.resolve().then(s.bind(s,84369))},67264:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,16444,23)),Promise.resolve().then(s.t.bind(s,16042,23)),Promise.resolve().then(s.t.bind(s,88170,23)),Promise.resolve().then(s.t.bind(s,49477,23)),Promise.resolve().then(s.t.bind(s,29345,23)),Promise.resolve().then(s.t.bind(s,12089,23)),Promise.resolve().then(s.t.bind(s,46577,23)),Promise.resolve().then(s.t.bind(s,31307,23))},79737:(e,t,s)=>{"use strict";s.d(t,{Toaster:()=>o});let o=(0,s(12907).registerClientReference)(function(){throw Error("Attempted to call Toaster() from the server but Toaster is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/george/Desktop/projects/alobam-bank/src/components/ui/toaster.tsx","Toaster")},84369:(e,t,s)=>{"use strict";s.d(t,{AuthProvider:()=>g,A:()=>h});var o=s(60687),a=s(43210),r=s(7828),n=s(33784),i=s(75535),l=s(29867),c=s(6475);let d=(0,c.createServerReference)("604312656f2004c1bcb55da4e8d649d32b089bca51",c.callServer,void 0,c.findSourceMapURL,"getEmailTemplateAndSubject"),m=(0,c.createServerReference)("4034cc97d27439f4c059c8a95b03da6fa61b86b0db",c.callServer,void 0,c.findSourceMapURL,"sendTransactionalEmail");var u=s(22141);let p=(0,a.createContext)(void 0),g=({children:e})=>{let[t,s]=(0,a.useState)(null),[c,g]=(0,a.useState)(null),[h,f]=(0,a.useState)(!0),{toast:y}=(0,l.dj)(),b=async e=>{let t=(0,i.H9)(n.db,"users",e);try{let s=await (0,i.x7)(t);if(s.exists()){let t=s.data(),o="number"==typeof t.balance?t.balance:0,a=t.primaryCurrency||"USD";g({...t,uid:e,balance:o,primaryCurrency:a})}else console.warn(`User profile document not found for UID: ${e}. User might be new or data is missing.`),g(null)}catch(e){g(null),"unavailable"===e.code||e.message?.includes("client is offline")||e.message?.includes("Failed to get document because the client is offline")?(console.warn("fetchUserProfile: Firestore client is offline or unreachable:",e.message),y({title:"Network Issue",description:"Could not load your profile details. You appear to be offline.",variant:"destructive"})):(console.error("fetchUserProfile: Error fetching user profile:",e),y({title:"Profile Error",description:"Could not load your profile details due to an unexpected error.",variant:"destructive"}))}};(0,a.useEffect)(()=>{let e=(0,r.hg)(n.j2,async e=>{f(!0),e?(s(e),await b(e.uid)):(s(null),g(null)),f(!1)});return()=>e()},[]);let v=async e=>{f(!0),console.log(`signIn: Attempting Firebase sign-in for: ${e.email}`);try{let t=(await (0,r.x9)(n.j2,e.email,e.password)).user;console.log(`signIn: Firebase sign-in successful for UID: ${t.uid}`);let o=(0,i.H9)(n.db,"users",t.uid),a=await (0,i.x7)(o),l=null;if(a.exists()){let e=a.data();l={...e,uid:t.uid,balance:"number"==typeof e.balance?e.balance:0,primaryCurrency:e.primaryCurrency||"USD"},g(l)}else console.warn(`signIn: User profile document not found for UID: ${t.uid} immediately after login. This is unexpected for an existing user.`);return s(t),f(!1),t}catch(t){throw f(!1),console.error(`signIn: Error during Firebase sign-in for ${e.email}:`,t.code,t.message),t}},$=async e=>{f(!0);let t=null;try{console.log("signUp: Attempting to create Firebase Auth user for:",e.email),t=(await (0,r.eJ)(n.j2,e.email,e.password)).user,console.log("signUp: Firebase Auth user created successfully. UID:",t.uid);let o=(0,i.H9)(n.db,"users",t.uid),a=Math.floor(1e9+9e9*Math.random()).toString(),l=`${e.firstName} ${e.lastName}`,c=e.currency||"USD",p={uid:t.uid,email:t.email,firstName:e.firstName,lastName:e.lastName,displayName:l,photoURL:null,phoneNumber:e.phoneNumber||void 0,accountType:e.accountType||"user_default_type",balance:0,primaryCurrency:c,kycStatus:"not_started",role:e.email===process.env.NEXT_PUBLIC_ADMIN_EMAIL?"admin":"user",accountNumber:a,isFlagged:!1,accountHealthScore:75,profileCompletionPercentage:50,isSuspended:!1};try{console.log("signUp: Attempting to create Firestore profile for UID:",t.uid,p),await (0,i.BN)(o,p),console.log("signUp: Firestore profile created successfully for UID:",t.uid)}catch(e){if(console.error("signUp: CRITICAL - Failed to create Firestore profile for UID:",t.uid,e),t){console.warn("signUp: Attempting to delete Firebase Auth user due to Firestore profile creation failure. UID:",t.uid);try{await (0,r.hG)(t),console.log("signUp: Firebase Auth user deleted successfully after Firestore failure. UID:",t.uid)}catch(e){console.error("signUp: CRITICAL - Failed to delete Firebase Auth user after Firestore failure. Orphaned Auth user may exist. UID:",t.uid,e)}}throw e}if(g(p),s(t),f(!1),t.email){console.log(`signUp: Preparing to send welcome email to: ${t.email}`);let e=await (0,u.J)(),s={fullName:l||"Valued User",bankName:e.settings?.platformName||"Wohana Funds",emailLogoImageUrl:e.settings?.emailLogoImageUrl,accountNumber:a,loginUrl:`${process.env.NEXT_PUBLIC_BASE_URL||"http://localhost:9002"}/dashboard`,supportEmail:e.settings?.supportEmail};console.log("signUp: Email payload for template:",s);try{let e=await d("WELCOME",s);e.html?(console.log(`signUp: Attempting to send welcome email. Subject: "${e.subject}"`),m({to:t.email,subject:e.subject,htmlBody:e.html,textBody:`Welcome to ${s.bankName}, ${s.fullName}! Your account is ready. Account Number: ${s.accountNumber}. Login at ${s.loginUrl}`}).then(e=>{e.success?console.log(`signUp: Welcome email sent successfully to: ${t.email}. Message: ${e.message}`):console.error(`signUp: Failed to send welcome email to ${t.email}: ${e.message}`,e.error)}).catch(e=>{console.error(`signUp: Exception sending welcome email to ${t.email}:`,e)})):console.warn('signUp: Welcome email HTML content was null or empty for type "WELCOME".')}catch(e){console.error(`signUp: Exception preparing welcome email content for ${t.email}:`,e.message,JSON.stringify(e,Object.getOwnPropertyNames(e)))}}else console.warn("signUp: New user has no email, cannot send welcome email. UID:",t.uid);return t}catch(s){if(f(!1),console.error("signUp: CLIENT-SIDE CAUGHT ERROR during overall signup for:",e.email,"Error Code:",s.code,"Error Message:",s.message,"Full Error:",JSON.stringify(s,Object.getOwnPropertyNames(s))),t&&"auth/email-already-in-use"!==s.code&&!s.message?.includes("Firestore")){console.warn("signUp: Attempting to delete Firebase Auth user due to an error after creation but before Firestore (or non-Firestore error). UID:",t.uid);try{await (0,r.hG)(t),console.log("signUp: Firebase Auth user deleted successfully due to post-creation error. UID:",t.uid)}catch(e){console.error("signUp: CRITICAL - Failed to delete Firebase Auth user. Orphaned Auth user may exist. UID:",t.uid,e)}}throw s}},w=async e=>{let t=n.j2.currentUser;if(!t||!t.email)return{success:!1,message:"User not authenticated or email missing."};f(!0);try{let s=r.IX.credential(t.email,e.currentPassword);await (0,r.kZ)(t,s),await (0,r.f3)(t,e.newPassword),f(!1);let o=await (0,u.J)(),a={fullName:c?.displayName||t.displayName||"Valued User",bankName:o.settings?.platformName||"Wohana Funds",emailLogoImageUrl:o.settings?.emailLogoImageUrl,loginUrl:`${process.env.NEXT_PUBLIC_BASE_URL||"http://localhost:9002"}/dashboard`,passwordChangedDate:new Date().toISOString(),supportEmail:o.settings?.supportEmail};try{let e=await d("PASSWORD_CHANGED",a);e.html&&m({to:t.email,subject:e.subject,htmlBody:e.html,textBody:`Your password for ${a.bankName} was successfully changed on ${new Date(a.passwordChangedDate).toLocaleDateString()}. If you did not make this change, please contact support immediately.`}).then(e=>{e.success?console.log("Password changed email sent successfully."):console.error("Failed to send password changed email:",e.error)})}catch(e){console.error("Error preparing/sending password changed email:",e.message)}return{success:!0,message:"Password updated successfully."}}catch(t){f(!1);let e="Failed to change password. Please try again.";return"auth/wrong-password"===t.code?e="Incorrect current password.":"auth/weak-password"===t.code?e="The new password is too weak.":console.error("Error changing password:",t),{success:!1,message:e}}},x=async()=>{f(!0);try{await (0,r.CI)(n.j2),s(null),g(null)}catch(e){throw console.error("Error signing out:",e),y({title:"Sign Out Failed",description:"Could not sign out. Please try again.",variant:"destructive"}),e}finally{f(!1)}};return(0,o.jsx)(p.Provider,{value:{user:t,loading:h,signIn:v,signUp:$,signOut:x,changeUserPassword:w,userProfile:c,fetchUserProfile:b},children:e})},h=()=>{let e=(0,a.useContext)(p);if(void 0===e)throw Error("useAuth must be used within an AuthProvider");return e}},93670:(e,t,s)=>{"use strict";s.d(t,{AuthProvider:()=>a});var o=s(12907);let a=(0,o.registerClientReference)(function(){throw Error("Attempted to call AuthProvider() from the server but AuthProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/george/Desktop/projects/alobam-bank/src/hooks/use-auth.tsx","AuthProvider");(0,o.registerClientReference)(function(){throw Error("Attempted to call useAuth() from the server but useAuth is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/home/george/Desktop/projects/alobam-bank/src/hooks/use-auth.tsx","useAuth")},94431:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>p,generateViewport:()=>u,metadata:()=>m});var o=s(37413),a=s(13319),r=s.n(a),n=s(3235),i=s.n(n);s(61135);var l=s(93670),c=s(79737),d=s(31669);let m={title:"Wohana Funds",description:"Experience banking designed for the digital age with excellent customer service.",manifest:"/manifest.json",icons:{icon:"/favicon.ico"}};async function u(){return{themeColor:[{media:"(prefers-color-scheme: light)",color:"hsl(var(--primary))"},{media:"(prefers-color-scheme: dark)",color:"hsl(var(--primary))"}]}}function p({children:e}){return(0,o.jsxs)("html",{lang:"en",suppressHydrationWarning:!0,className:`${r().variable} ${i().variable}`,children:[(0,o.jsx)("head",{children:(0,o.jsx)("script",{id:"tawkto-script",type:"text/javascript",dangerouslySetInnerHTML:{__html:`
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/68486ec0738b21190a1ce420/default';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
              })();
            `}})}),(0,o.jsx)("body",{className:"antialiased",children:(0,o.jsx)(d.ThemeProvider,{attribute:"class",defaultTheme:"system",enableSystem:!0,disableTransitionOnChange:!0,children:(0,o.jsxs)(l.AuthProvider,{children:[e,(0,o.jsx)(c.Toaster,{})]})})})]})}}};