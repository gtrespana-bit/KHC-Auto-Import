// Imágenes facilitadas para el borrador mobile.de 48386412615008.
// Se importan desde public/ para que Vite las incluya en /erp/ en producción
// y las sirva también durante el desarrollo del ERP.
import audi3Photo01 from '../../../public/images/audi a3 gris/b256b223-8b15-410f-98bb-469a205f3add.avif';
import audi3Photo02 from '../../../public/images/audi a3 gris/ff0a1f3f-1fb2-4959-b375-0bbde13ee2e6.avif';
import audi3Photo03 from '../../../public/images/audi a3 gris/1d1b62dc-c276-4877-ac07-be05c83c07b5.avif';
import audi3Photo04 from '../../../public/images/audi a3 gris/39c91e98-5f7d-47b8-a122-3df9bea8b828.avif';
import audi3Photo05 from '../../../public/images/audi a3 gris/d12c61ca-fe0b-44bb-b422-a9af7da454f6.avif';
import audi3Photo06 from '../../../public/images/audi a3 gris/d3c01dd9-8447-4732-a5a3-5b17ca1309d5.avif';
import audi3Photo07 from '../../../public/images/audi a3 gris/6b40f3c4-2044-4467-869f-acfa1de9fe1f.avif';
import audi3Photo08 from '../../../public/images/audi a3 gris/b789581b-7bab-4238-a28a-8661c5c5a82e.avif';
import audi3Photo09 from '../../../public/images/audi a3 gris/5b3ea37c-54b0-4c83-8696-ca2506eac3c7.avif';
import { PENDING_VEHICLE_IMPORT_DATA } from './vehicleImportDraftData.js';

const PHOTO_ASSETS = {
  'b256b223-8b15-410f-98bb-469a205f3add.avif': audi3Photo01,
  'ff0a1f3f-1fb2-4959-b375-0bbde13ee2e6.avif': audi3Photo02,
  '1d1b62dc-c276-4877-ac07-be05c83c07b5.avif': audi3Photo03,
  '39c91e98-5f7d-47b8-a122-3df9bea8b828.avif': audi3Photo04,
  'd12c61ca-fe0b-44bb-b422-a9af7da454f6.avif': audi3Photo05,
  'd3c01dd9-8447-4732-a5a3-5b17ca1309d5.avif': audi3Photo06,
  '6b40f3c4-2044-4467-869f-acfa1de9fe1f.avif': audi3Photo07,
  'b789581b-7bab-4238-a28a-8661c5c5a82e.avif': audi3Photo08,
  '5b3ea37c-54b0-4c83-8696-ca2506eac3c7.avif': audi3Photo09,
};

export const PENDING_VEHICLE_IMPORTS = PENDING_VEHICLE_IMPORT_DATA.map((draft) => ({
  ...draft,
  photos: draft.photos.map((photo) => ({
    ...photo,
    src: PHOTO_ASSETS[photo.filename],
  })),
}));
