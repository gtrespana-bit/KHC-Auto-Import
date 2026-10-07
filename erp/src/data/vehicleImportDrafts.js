// Fotos del borrador mobile.de 48386412615008.
// Las cuatro vistas exteriores usan fondos homogeneizados para la web; los
// originales del anuncio se conservan y las cinco fotos de interior/maletero
// permanecen intactas. Vite empaqueta estos assets desde public/.
import audi3Photo01 from '../../../public/images/audi a3 gris editadas/audi-a3-frontal.jpg';
import audi3Photo02 from '../../../public/images/audi a3 gris editadas/audi-a3-trasera.jpg';
import audi3Photo03 from '../../../public/images/audi a3 gris editadas/audi-a3-lateral-1.jpg';
import audi3Photo04 from '../../../public/images/audi a3 gris editadas/audi-a3-lateral-2.jpg';
import audi3Photo05 from '../../../public/images/audi a3 gris/d12c61ca-fe0b-44bb-b422-a9af7da454f6.avif';
import audi3Photo06 from '../../../public/images/audi a3 gris/d3c01dd9-8447-4732-a5a3-5b17ca1309d5.avif';
import audi3Photo07 from '../../../public/images/audi a3 gris/6b40f3c4-2044-4467-869f-acfa1de9fe1f.avif';
import audi3Photo08 from '../../../public/images/audi a3 gris/b789581b-7bab-4238-a28a-8661c5c5a82e.avif';
import audi3Photo09 from '../../../public/images/audi a3 gris/5b3ea37c-54b0-4c83-8696-ca2506eac3c7.avif';
import { PENDING_VEHICLE_IMPORT_DATA } from './vehicleImportDraftData.js';

const PHOTO_ASSETS = {
  'audi a3 gris editadas/audi-a3-frontal.jpg': audi3Photo01,
  'audi a3 gris editadas/audi-a3-trasera.jpg': audi3Photo02,
  'audi a3 gris editadas/audi-a3-lateral-1.jpg': audi3Photo03,
  'audi a3 gris editadas/audi-a3-lateral-2.jpg': audi3Photo04,
  'audi a3 gris/d12c61ca-fe0b-44bb-b422-a9af7da454f6.avif': audi3Photo05,
  'audi a3 gris/d3c01dd9-8447-4732-a5a3-5b17ca1309d5.avif': audi3Photo06,
  'audi a3 gris/6b40f3c4-2044-4467-869f-acfa1de9fe1f.avif': audi3Photo07,
  'audi a3 gris/b789581b-7bab-4238-a28a-8661c5c5a82e.avif': audi3Photo08,
  'audi a3 gris/5b3ea37c-54b0-4c83-8696-ca2506eac3c7.avif': audi3Photo09,
};

export const PENDING_VEHICLE_IMPORTS = PENDING_VEHICLE_IMPORT_DATA.map((draft) => ({
  ...draft,
  photos: draft.photos.map((photo) => ({
    ...photo,
    src: PHOTO_ASSETS[photo.assetPath],
  })),
}));
