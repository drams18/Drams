/* PROFILE.JS : identité, présentation, spécialités, coordonnées. */

export class Profile {
  constructor(section, contact) {
    const bio = section.bio;
    this.name = bio.name;
    this.title = bio.title;
    this.location = bio.location;
    this.availability = bio.availability;
    this.seeking = bio.seeking;
    this.description = bio.description;
    this.languages = bio.languages || [];
    this.socials = bio.socials || [];
    this.positioning = section.positioning || '';
    this.aboutStack = section.aboutStack || '';
    this.qualities = section.qualities || [];
    this.skillGroups = section.skillGroups || [];
    this.cv = 'assets/CV.pdf';
    // Coordonnées : js/contact.js reste la source unique quand il est chargé.
    const CW = typeof window !== 'undefined' ? window.ContactWidget : null;
    this.email = (CW && CW.EMAIL) || contact.email;
    this.phone = (CW && CW.PHONE) || contact.phone;
    this.phoneTel = (CW && CW.PHONE_TEL) || this.phone.replace(/[^\d+]/g, '');
    this.links = contact.links || [];
  }
}
