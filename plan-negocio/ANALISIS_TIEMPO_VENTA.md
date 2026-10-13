# Análisis del tiempo de venta, modelo a modelo

> **12 de octubre de 2026 · uso interno.** Cuánto tarda cada coche en venderse, con
> la evidencia disponible y por qué ese número decide el tamaño del negocio: con
> 7 plazas y un ciclo de 50 días salen ~4 ventas al mes; con ciclos de 75 días,
> la mitad.
> Acompaña a `modelo_realista.py`, donde estos días son el parámetro `dias` de
> cada unidad.

---

## 1. Lo que dice el mercado (evidencia externa, oct-2026)

| Fuente | Fecha | Dato |
|---|---|---|
| **Autouncle** (portal, 349.043 ofertas) | oct-2026 | **Mediana de 40 días** anunciado antes de desaparecer el anuncio |
| **Faconauto** (vía Autopista) | 2026 | Turismo de **combustión: 43 días** en stock. **Eléctrico: 103 días** |
| **MSI** (vía Autocasión/sensorautomotriz) | 2026 | **43 días online · 90 días** en tienda física |
| **Coches.net / Autovista24** (top 5 de España) | jun-2024 | Media del mes: **58,4 días**. Los 5 más rápidos: RAV4 33,4 · Yaris 34,5 · C-HR 34,6 · i20 38,5 · XC60 38,6 |
| **Green Car Monitor / Sumauto** | 2022-23 | Concesionarios: **<75 días** de media (103 en 2021) |
| **Ganvam / Autonocion** | sep-2026 | Diésel = **48,1 %** de las ventas de ocasión. El mercado no ha abandonado la combustión |
| **La rotación profesional sana** (criterio del sector, aportado por el dueño) | — | **30-45 días** para un seminuevo estándar a precio justo |

**Las tres cifras que mandan**: un turismo de combustión pasa ~**43 días** en
stock; la mediana de un anuncio es de ~**40 días**; **el coche más rápido de
España tarda 33-38 días**. La horquilla profesional 30-45 días es, por tanto, el
filo optimista del mercado — alcanzable con los modelos de máxima demanda, no con
cualquiera.

## 2. El tamaño del mercado (la comprobación que faltaba)

Una cifra que conviene tener a mano antes de discutir velocidades: **cuántos
coches se venden en la zona**.

- España: **2.182.436 turismos usados** en el año móvil (1.091.218 en el primer
  semestre de 2026, Autonocion).
- 0,045 coches usados por habitante y año.
- **Área metropolitana de Santiago: ~7.200 coches al año.** Concello: ~4.400.

Con eso, vender 42 coches al año (el ritmo del plan recomendado) es **el 0,6 % del
mercado del área** y 703.000 € de facturación: un compraventa pequeño, no un
supuesto heroico. **Este número tumba el supuesto que tenía el modelo antes**: los
«techos de demanda por modelo» sumaban 68 coches al año para todo el catálogo, es
decir, el 0,9 % del mercado. Estaba limitando el negocio a la centésima parte de
lo que la zona absorbe. El límite real es **cuántas plazas tiene la nave y cuánto
capital hay para llenarlas**, no la demanda.

## 3. El tiempo de venta que usamos, modelo a modelo

Criterio: **los modelos de máxima demanda al nivel de los más rápidos de España
(32-35 días) y el resto por encima de la media (45-55)**, porque un modelo de
nicho tarda más y un negocio nuevo no gira más rápido que la media. Los números
que usa el modelo (parámetro `dias`):

| Coche | Qué es | Días | Por qué ese número |
|---|---|---|---|
| **Seat León 2.0 TDI FR** | compacto generalista diésel, 12.900 € | **32** | «Gran rotación» en `docs/07` (12-18 d) y misma mecánica EA288 que el Golf. Entra en el catálogo con la v3: es el que mejor combina precio, rotación y margen |
| **VW Golf VIII** | compacto generalista, 14.617 € | **32** | El coche con más demanda de Galicia (`docs/03`, `docs/06`: «el rey de la liquidez») |
| **BMW 116d** | compacto premium diésel, 9.010 € | **35** | El tramo 12.000-15.000 € de PVP es el más líquido del mercado: es el coche que más gente puede pagar |
| **Audi A3 1.0 TFSI** | compacto premium gasolina, 12.455 € | **35** | Mismo tramo de precio; la gasolina pequeña es hoy el volumen del mercado particular (0,5 M de operaciones en 2026) |
| **Golf GTI** | deportivo gasolina, 12.674 € | **45** | 38 % de margen sobre coste, el mejor del catálogo, pero **nicho**: menos compradores, más tiempo por unidad |
| **Volvo XC40 D3** | SUV premium diésel, 14.738 € | **45** | SUV premium de marca de volumen medio: demanda sólida, mercado más estrecho que un compacto |
| **BMW 318d Touring** | familiar premium diésel, 14.220 € | **45** | El familiar diésel es fuerte en Galicia, pero el público de ranchera premium es menor |
| **Mercedes C Estate** | ranchera premium grande, 17.666 € | **55** | El tramo 18.000-24.000 € con carrocería familiar es el más estrecho: el que más capital inmoviliza |

**Ciclo completo del dinero** = 1 semana de viaje y preparación + estos días
(con estacionalidad y rampa del negocio).

## 4. Lo que de verdad decide: euros por mes y por euro invertido

Un coche no es bueno sólo porque se venda rápido, ni sólo porque deje margen: es
bueno cuando deja margen **y** devuelve el dinero rápido. Ordenando el catálogo
por beneficio neto al mes sobre el capital inmovilizado:

| Coche | Margen neto | % sobre coste | Días | **€ de beneficio al mes por 1.000 € invertidos** |
|---|---|---|---|---|
| **BMW 116d** | 2.863,64 € | 31,8 % | 35 | **227 €** |
| **Seat León 2.0 TDI FR** | 3.801,65 € | 29,5 % | 32 | **227 €** |
| **Golf GTI** | 4.814,88 € | 38,0 % | 45 | **219 €** |
| VW Golf VIII | 3.374,38 € | 23,1 % | 32 | 178 € |
| Audi A3 1.0 TFSI | 2.921,49 € | 23,5 % | 35 | 168 € |
| Mercedes C Estate | 5.226,45 € | 29,6 % | 55 | 143 € |
| Volvo XC40 D3 | 3.109,09 € | 21,1 % | 45 | 122 € |
| BMW 318d Touring | 2.504,13 € | 17,6 % | 45 | **102 €** |

Lectura directa:

- **El 116d y el León son la pareja ideal**: el más barato del catálogo y el mejor
  equilibrado. Los dos rinden 227 €/mes por cada 1.000 € inmovilizados.
- **El GTI es la sorpresa**: aunque tarde 45 días, su 38 % de margen lo pone
  tercero. Un GTI parado 45 días rinde más que un 318d parado 45.
- **El 318d no se compra.** Es el peor retorno del catálogo (102 €/mes por 1.000 €,
  menos de la mitad que un 116d) y compite por la misma plaza que coches mejores.
  El propio modelo optimizado **no lo elige ni una vez en 250 simulaciones**.
- **El Mercedes tiene sentido cuando sobre el dinero**: mayor margen absoluto del
  catálogo y aún rinde 143 €/mes.
- **El XC40 es el que menos aporta de los que sí se compran** (122 €/mes): entra
  tarde, cuando la nave ya está llena y siempre hay alguien mejor.

**El trío de arranque lo confirman los números**: 116d (227) + GTI (219) + A3 (168)
son tres de los cuatro mejores y caben con los 34.139 € disponibles el día 1. En
cuanto la nave se llene, **el Golf VIII y el León (32 días) son los que deben
estar siempre dentro**.

## 5. Cómo se comporta el ciclo en la simulación

Con venta por coche (cada unidad a su ritmo, sin cuotas de mercado), el ciclo
medido en 250 simulaciones es:

| Modelo | 1) Traerlo | 2) Venta | Ciclo medido | Diferencia |
|---|---|---|---|---|
| Seat León | 7 | 32 | **45 d** | +6 d (rampa y agosto) |
| VW Golf VIII | 7 | 32 | **45 d** | +6 d |
| Audi A3 | 7 | 35 | **47 d** | +5 d |
| BMW 116d | 7 | 35 | **50 d** | +8 d |
| Volvo XC40 | 7 | 45 | **53 d** | +1 d |
| Golf GTI | 7 | 45 | **57 d** | +5 d |
| Mercedes C Estate | 7 | 55 | **59 d** | −3 d |

La diferencia entre el ciclo medido y `7 + días` es la **rampa del negocio**
(65 % de ritmo los seis primeros meses) y las **estacionalidades** (agosto al
60 %), que son las que hacen que en los primeros meses un coche tarde algo más.

**Nota sobre la «cola» de versiones anteriores.** En la v1 y la v2 el modelo
añadía a cada coche una espera extra de 20-46 días («cola») porque varios coches
competían por una cuota mensual de demanda por modelo. Esa cola era un artefacto
de dos supuestos míos que no se sostenían: (a) un techo de demanda por modelo que
sumaba 68 coches al año para todo el catálogo —el 0,9 % del mercado real del área
(sección 2)— y (b) comprar varias unidades idénticas, que sí compiten entre
ellas. Corregido: **cada coche vende a su ritmo, nunca hay dos iguales en la
nave y el límite son las plazas y el capital.** El ciclo bajó de 76 a 50 días y
las ventas de 80 a 127 en 36 meses. El dueño tenía razón en la mecánica.

## 6. Cómo medirlo en la práctica (y cerrar este debate con datos)

Esto no se decide con opiniones: se decide con el registro de la operación.

- **Un campo por coche**: fecha de compra, fecha de anuncio, fecha de cobro, y los
  tres números que salen de ahí (días de logística, días de venta, ciclo). El ERP
  ya tiene los estados del vehículo; sólo hay que fijar la fecha de anuncio.
- **Revisión a los 6 meses**: comparar los días reales por modelo con esta tabla.
  Si el 116d sale a 25 días, el modelo se ajusta solo y las cifras suben; si sale
  a 60, al revés. El objetivo del piloto (`docs/05`) es < 35 días por unidad.
- **Regla de descarte**: cualquier coche que pase de **60 días** anunciado sin
  venderse, se baja de precio hasta que salga. Un coche parado cuesta más que
  cualquier rebaja: 14.000 € inmovilizados dos meses son ~1.700 € de beneficio
  perdido, y además ocupan una plaza que vale 25.000-60.000 € en tres años.
- **Chequeo de coherencia cada trimestre**: ventas del trimestre ÷ (plazas × 90 ÷
  ciclo medio). Si el resultado es menor que 0,8, la nave no está llena o hay
  coches parados; si es mayor, el ciclo real es mejor que el supuesto.

---

### Resumen en cinco líneas

1. El mercado vende un turismo de combustión en ~43 días; el más rápido de España,
   en 33-38. La horquilla profesional sana es 30-45 días.
2. El área de Santiago vende ~7.200 coches al año: el plan propone 42 al año
   (0,6 % del mercado). **El límite son las plazas y el capital, no la demanda.**
3. Los días están puestos por modelo: **32** para León y Golf VIII, **35** para
   116d y A3, **45** para GTI, XC40 y 318d, **55** para el Mercedes.
4. Por eficiencia del capital: **116d = León > GTI > Golf VIII > A3 > Mercedes >
   XC40 > 318d**. El 318d no debe comprarse.
5. Cada plaza de la nave vale 25.000-60.000 € en tres años. La disciplina que
   mueve la aguja es **llenar las plazas y mantenerlas llenas**; la búsqueda de
   coches ya está cubierta.
