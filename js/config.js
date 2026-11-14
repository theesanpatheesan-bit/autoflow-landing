/* =====================================================
   AutoFlow – site configuration
   Edit ONLY this file to connect forms, analytics, socials.
   ===================================================== */
window.AUTOFLOW_CONFIG = {
  /* 1) FORMS ---------------------------------------------------------
     Create a free form at https://formspree.io (or Web3Forms / Getform),
     then paste the endpoint URL here, e.g. "https://formspree.io/f/abcdwxyz".
     Submissions are emailed to your team and stored in the dashboard.
     Leave "" to run in DEMO mode (data is only saved in the browser). */
  formEndpoints: {
    waitlist: "",
    contact: ""
  },

  /* 2) ANALYTICS -----------------------------------------------------
     Google Analytics 4 measurement ID, e.g. "G-XXXXXXXXXX".
     Tracks visitors + custom events: waitlist_signup, contact_submit, cta_click. */
  ga4Id: "",
  /* Optional privacy-friendly alternative: your domain for Plausible, e.g. "autoflow.lk" */
  plausibleDomain: "",

  /* 3) CONTACT ------------------------------------------------------- */
  email: "hello@autoflow.lk",          // TODO: replace with your official project email
  phone: "+94 77 000 0000",            // TODO: replace or set to "" to hide
  social: {
    facebook:  "https://www.facebook.com/",   // TODO: your page URLs
    instagram: "https://www.instagram.com/",
    linkedin:  "https://www.linkedin.com/",
    youtube:   "https://www.youtube.com/",
    github:    "https://github.com/"
  }
};
