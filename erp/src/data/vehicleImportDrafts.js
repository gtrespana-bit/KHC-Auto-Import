// Fotos de los borradores de importación versionados en el código.
// Las vistas exteriores de los tres coches usan fondos homogeneizados a la
// ubicación de la empresa (fachada de hormigón y madera); los originales del
// anuncio se conservan en la carpeta del coche y las fotos de interior y
// maletero permanecen intactas. Vite empaqueta estos assets desde public/.
import audi3Photo01 from '../../../public/images/audi a3 gris editadas/audi-a3-frontal.jpg';
import audi3Photo02 from '../../../public/images/audi a3 gris editadas/audi-a3-trasera.jpg';
import audi3Photo03 from '../../../public/images/audi a3 gris editadas/audi-a3-lateral-1.jpg';
import audi3Photo04 from '../../../public/images/audi a3 gris editadas/audi-a3-lateral-2.jpg';
import audi3Photo05 from '../../../public/images/audi a3 gris/d12c61ca-fe0b-44bb-b422-a9af7da454f6.avif';
import audi3Photo06 from '../../../public/images/audi a3 gris/d3c01dd9-8447-4732-a5a3-5b17ca1309d5.avif';
import audi3Photo07 from '../../../public/images/audi a3 gris/6b40f3c4-2044-4467-869f-acfa1de9fe1f.avif';
import audi3Photo08 from '../../../public/images/audi a3 gris/b789581b-7bab-4238-a28a-8661c5c5a82e.avif';
import audi3Photo09 from '../../../public/images/audi a3 gris/5b3ea37c-54b0-4c83-8696-ca2506eac3c7.avif';
import bmw3Photo01 from '../../../public/images/bmw serie 3 touring editadas/bmw-318d-tres-cuartos-frontal.jpg';
import bmw3Photo02 from '../../../public/images/bmw serie 3 touring editadas/bmw-318d-frontal.jpg';
import bmw3Photo03 from '../../../public/images/bmw serie 3 touring editadas/bmw-318d-tres-cuartos-frontal-derecho.jpg';
import bmw3Photo04 from '../../../public/images/bmw serie 3 touring editadas/bmw-318d-lateral.jpg';
import bmw3Photo05 from '../../../public/images/bmw serie 3 touring editadas/bmw-318d-tres-cuartos-trasero.jpg';
import bmw3Photo06 from '../../../public/images/bmw serie 3 touring editadas/bmw-318d-trasera.jpg';
import bmw3Photo07 from '../../../public/images/bmw serie 3 touring/533f0016-f1e9-4cb7-8298-83df592fd5b8.avif';
import bmw3Photo08 from '../../../public/images/bmw serie 3 touring/3779cc3c-91a5-4d2e-ab2a-fb9b8cd8c6f8.jfif';
import bmw3Photo09 from '../../../public/images/bmw serie 3 touring/b1e45a23-c936-49b7-b013-6a38b4c0e37b.avif';
import bmw3Photo10 from '../../../public/images/bmw serie 3 touring/0abe4cf5-4577-4ee1-a7dd-b5f6ade030b5.avif';
import bmw3Photo11 from '../../../public/images/bmw serie 3 touring/0eacf341-a706-4be6-b18d-05c7749fd52a.avif';
import golf8Photo01 from '../../../public/images/golf gris 2022 editadas/vw-golf-viii-tres-cuartos-frontal.jpg';
import golf8Photo02 from '../../../public/images/golf gris 2022 editadas/vw-golf-viii-frontal.jpg';
import golf8Photo03 from '../../../public/images/golf gris 2022 editadas/vw-golf-viii-lateral-1.jpg';
import golf8Photo04 from '../../../public/images/golf gris 2022 editadas/vw-golf-viii-lateral-2.jpg';
import golf8Photo05 from '../../../public/images/golf gris 2022 editadas/vw-golf-viii-tres-cuartos-trasero.jpg';
import golf8Photo06 from '../../../public/images/golf gris 2022 editadas/vw-golf-viii-trasera.jpg';
import golf8Photo07 from '../../../public/images/golf gris 2022/9662cb1d-29f3-4e9b-85e5-a16bc1309249.avif';
import golf8Photo08 from '../../../public/images/golf gris 2022/afae077d-1bb0-4179-9bed-d4ca408d16af.avif';
import golf8Photo09 from '../../../public/images/golf gris 2022/3fbacaa4-3530-4d43-b679-1e589685126c.avif';
import golf8Photo10 from '../../../public/images/golf gris 2022/7f367c22-813a-43d6-97ab-8e890263767b.jfif';
import golf8Photo11 from '../../../public/images/golf gris 2022/88b8aaa2-b1d2-48bc-a9a4-23df514e7da2.jfif';
import golf8Photo12 from '../../../public/images/golf gris 2022/09644f89-fd33-4a7f-b93d-a0cebf1ad342.jfif';
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
  'bmw serie 3 touring editadas/bmw-318d-tres-cuartos-frontal.jpg': bmw3Photo01,
  'bmw serie 3 touring editadas/bmw-318d-frontal.jpg': bmw3Photo02,
  'bmw serie 3 touring editadas/bmw-318d-tres-cuartos-frontal-derecho.jpg': bmw3Photo03,
  'bmw serie 3 touring editadas/bmw-318d-lateral.jpg': bmw3Photo04,
  'bmw serie 3 touring editadas/bmw-318d-tres-cuartos-trasero.jpg': bmw3Photo05,
  'bmw serie 3 touring editadas/bmw-318d-trasera.jpg': bmw3Photo06,
  'bmw serie 3 touring/533f0016-f1e9-4cb7-8298-83df592fd5b8.avif': bmw3Photo07,
  'bmw serie 3 touring/3779cc3c-91a5-4d2e-ab2a-fb9b8cd8c6f8.jfif': bmw3Photo08,
  'bmw serie 3 touring/b1e45a23-c936-49b7-b013-6a38b4c0e37b.avif': bmw3Photo09,
  'bmw serie 3 touring/0abe4cf5-4577-4ee1-a7dd-b5f6ade030b5.avif': bmw3Photo10,
  'bmw serie 3 touring/0eacf341-a706-4be6-b18d-05c7749fd52a.avif': bmw3Photo11,
  'golf gris 2022 editadas/vw-golf-viii-tres-cuartos-frontal.jpg': golf8Photo01,
  'golf gris 2022 editadas/vw-golf-viii-frontal.jpg': golf8Photo02,
  'golf gris 2022 editadas/vw-golf-viii-lateral-1.jpg': golf8Photo03,
  'golf gris 2022 editadas/vw-golf-viii-lateral-2.jpg': golf8Photo04,
  'golf gris 2022 editadas/vw-golf-viii-tres-cuartos-trasero.jpg': golf8Photo05,
  'golf gris 2022 editadas/vw-golf-viii-trasera.jpg': golf8Photo06,
  'golf gris 2022/9662cb1d-29f3-4e9b-85e5-a16bc1309249.avif': golf8Photo07,
  'golf gris 2022/afae077d-1bb0-4179-9bed-d4ca408d16af.avif': golf8Photo08,
  'golf gris 2022/3fbacaa4-3530-4d43-b679-1e589685126c.avif': golf8Photo09,
  'golf gris 2022/7f367c22-813a-43d6-97ab-8e890263767b.jfif': golf8Photo10,
  'golf gris 2022/88b8aaa2-b1d2-48bc-a9a4-23df514e7da2.jfif': golf8Photo11,
  'golf gris 2022/09644f89-fd33-4a7f-b93d-a0cebf1ad342.jfif': golf8Photo12,
};

export const PENDING_VEHICLE_IMPORTS = PENDING_VEHICLE_IMPORT_DATA.map((draft) => ({
  ...draft,
  photos: draft.photos.map((photo) => ({
    ...photo,
    src: PHOTO_ASSETS[photo.assetPath],
  })),
}));
