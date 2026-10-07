// Fotos de los borradores de importación versionados en el código.
// Las cuatro vistas exteriores del Audi usan fondos homogeneizados para la
// web; sus originales del anuncio se conservan y las cinco fotos de
// interior/maletero permanecen intactas. El BMW conserva los originales del
// anuncio tal cual (explican el estado de carrocería e interior del coche).
// Vite empaqueta estos assets desde public/.
import audi3Photo01 from '../../../public/images/audi a3 gris editadas/audi-a3-frontal.jpg';
import audi3Photo02 from '../../../public/images/audi a3 gris editadas/audi-a3-trasera.jpg';
import audi3Photo03 from '../../../public/images/audi a3 gris editadas/audi-a3-lateral-1.jpg';
import audi3Photo04 from '../../../public/images/audi a3 gris editadas/audi-a3-lateral-2.jpg';
import audi3Photo05 from '../../../public/images/audi a3 gris/d12c61ca-fe0b-44bb-b422-a9af7da454f6.avif';
import audi3Photo06 from '../../../public/images/audi a3 gris/d3c01dd9-8447-4732-a5a3-5b17ca1309d5.avif';
import audi3Photo07 from '../../../public/images/audi a3 gris/6b40f3c4-2044-4467-869f-acfa1de9fe1f.avif';
import audi3Photo08 from '../../../public/images/audi a3 gris/b789581b-7bab-4238-a28a-8661c5c5a82e.avif';
import audi3Photo09 from '../../../public/images/audi a3 gris/5b3ea37c-54b0-4c83-8696-ca2506eac3c7.avif';
import bmw3Photo01 from '../../../public/images/bmw serie 3 touring/123ceb58-dbc1-4e34-9491-5a38e1e19dcc.jfif';
import bmw3Photo02 from '../../../public/images/bmw serie 3 touring/8e0b1489-c363-49c5-8626-1fed21e1507b.avif';
import bmw3Photo03 from '../../../public/images/bmw serie 3 touring/42350c2a-b17e-4db9-af53-d3cd4d8d9240.avif';
import bmw3Photo04 from '../../../public/images/bmw serie 3 touring/93dc64f1-3ebf-4c97-b74a-9dc30fc832f5.jfif';
import bmw3Photo05 from '../../../public/images/bmw serie 3 touring/2d48433c-d1e3-4500-a8dc-2de417cb85ba.jfif';
import bmw3Photo06 from '../../../public/images/bmw serie 3 touring/923e2ffb-b260-494d-9101-9df3f1c56bb8.jfif';
import bmw3Photo07 from '../../../public/images/bmw serie 3 touring/533f0016-f1e9-4cb7-8298-83df592fd5b8.avif';
import bmw3Photo08 from '../../../public/images/bmw serie 3 touring/3779cc3c-91a5-4d2e-ab2a-fb9b8cd8c6f8.jfif';
import bmw3Photo09 from '../../../public/images/bmw serie 3 touring/b1e45a23-c936-49b7-b013-6a38b4c0e37b.avif';
import bmw3Photo10 from '../../../public/images/bmw serie 3 touring/0abe4cf5-4577-4ee1-a7dd-b5f6ade030b5.avif';
import bmw3Photo11 from '../../../public/images/bmw serie 3 touring/0eacf341-a706-4be6-b18d-05c7749fd52a.avif';
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
  'bmw serie 3 touring/123ceb58-dbc1-4e34-9491-5a38e1e19dcc.jfif': bmw3Photo01,
  'bmw serie 3 touring/8e0b1489-c363-49c5-8626-1fed21e1507b.avif': bmw3Photo02,
  'bmw serie 3 touring/42350c2a-b17e-4db9-af53-d3cd4d8d9240.avif': bmw3Photo03,
  'bmw serie 3 touring/93dc64f1-3ebf-4c97-b74a-9dc30fc832f5.jfif': bmw3Photo04,
  'bmw serie 3 touring/2d48433c-d1e3-4500-a8dc-2de417cb85ba.jfif': bmw3Photo05,
  'bmw serie 3 touring/923e2ffb-b260-494d-9101-9df3f1c56bb8.jfif': bmw3Photo06,
  'bmw serie 3 touring/533f0016-f1e9-4cb7-8298-83df592fd5b8.avif': bmw3Photo07,
  'bmw serie 3 touring/3779cc3c-91a5-4d2e-ab2a-fb9b8cd8c6f8.jfif': bmw3Photo08,
  'bmw serie 3 touring/b1e45a23-c936-49b7-b013-6a38b4c0e37b.avif': bmw3Photo09,
  'bmw serie 3 touring/0abe4cf5-4577-4ee1-a7dd-b5f6ade030b5.avif': bmw3Photo10,
  'bmw serie 3 touring/0eacf341-a706-4be6-b18d-05c7749fd52a.avif': bmw3Photo11,
};

export const PENDING_VEHICLE_IMPORTS = PENDING_VEHICLE_IMPORT_DATA.map((draft) => ({
  ...draft,
  photos: draft.photos.map((photo) => ({
    ...photo,
    src: PHOTO_ASSETS[photo.assetPath],
  })),
}));
