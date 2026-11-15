/* Edit only 'status' to update the public indicator.
   Options: inquiries (neutral default), open, limited, closed.
   Do not claim live availability unless confirmed by the designer. */
const studioSite = window.MASSYNE_STUDIO_CONTENT?.site || {};
const availabilityStatus = ["inquiries", "open", "limited", "closed"].includes(studioSite.availability)
  ? studioSite.availability
  : "inquiries";
window.MASSYNE_AVAILABILITY = Object.freeze({
  status: availabilityStatus,
  inquiryEmail: studioSite.email || "aazizimassine@gmail.com"
});

