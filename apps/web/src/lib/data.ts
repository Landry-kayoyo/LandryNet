
import seatedPresentationImage from '@assets/optimized/field-transmission.webp';
import writingPresentationImage from '@assets/optimized/field-method.webp';
import handshakeImage from '@assets/optimized/field-handshake.webp';
import diplomaImage from '@assets/optimized/profile-portrait.webp';
import field01PresentationImage from '@assets/optimized/field-transmission.webp';
import field02MethodImage from '@assets/optimized/field-02-method.webp';
import field03HandshakeImage from '@assets/optimized/field-handshake.webp';

export const navItems = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Services', href: '/services' },
  { label: 'Publications', href: '/projets' },
  { label: 'Terrain', href: '#terrain' },
  { label: 'Parcours', href: '#parcours' },
];



export const fieldNotes = [
  {
    number: '01',
    label: 'Transmission',
    title: 'Rendre le complexe lisible.',
    description:
      'Présenter, documenter et transmettre : une infrastructure devient solide quand elle peut être comprise par toute une équipe.',
    image: seatedPresentationImage,
    className: 'field-note-large',
  },
  {
    number: '02',
    label: 'Méthode',
    title: "Observer avant d\u2019agir.",
    description:
      'Chaque décision technique commence par le contexte, les contraintes et une lecture précise du terrain.',
    image: writingPresentationImage,
    className: 'field-note-tall',
  },
  {
    number: '03',
    label: 'Collaboration',
    title: 'Construire avec les bonnes personnes.',
    description:
      "Une infrastructure fiable se construit aussi dans l\u2019échange, la confiance et la transmission entre les personnes.",
    image: handshakeImage,
    className: 'field-note-wide',
  },
];

export const collagePhotos = [
  {
    label: 'Diplôme',
    description: 'Cérémonie de remise des grades et clôture de la formation.',
    image: diplomaImage,
  },
  {
    label: 'Présentation',
    description: 'Le terrain, la transmission et la mise en contexte du projet.',
    image: field01PresentationImage,
  },
  {
    label: 'Méthode',
    description: "Le travail de terrain, la méthode et l\u2019analyse avant l\u2019action.",
    image: field02MethodImage,
  },
  {
    label: 'Collaboration',
    description: "La collaboration, l\u2019échange et la dynamique collective sur le projet.",
    image: field03HandshakeImage,
  },
];

import brandLogo from '@assets/optimized/brand-logo.webp';
export const defaultCover = brandLogo;
export const siteUrl = import.meta.env.VITE_SITE_URL || 'https://landrynet.vercel.app';
const preferredContactEmail = 'kayoyolandry@gmail.com';
export const contactEmail =
  import.meta.env.VITE_CONTACT_EMAIL === 'hello@landrynet.vercel.app'
    ? preferredContactEmail
    : import.meta.env.VITE_CONTACT_EMAIL || preferredContactEmail;
export const apiBaseUrl =
  import.meta.env.VITE_API_URL ??
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api');

export const seoKeywords = [
  'Landry Kayoyo',
  'Landry Net',
  'LandryNet',
  'Administrateur systèmes et réseaux',
  'Infrastructure IT',
  'Monitoring IT',
  'Sécurité informatique',
  'Réseaux',
  'Automation informatique',
  'Lubumbashi',
  'RDC',
  'Portfolio professionnel',
  'Projets informatiques',
  'Expert infrastructure',
].join(', ');
