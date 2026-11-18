# Third-party notices

## Opensource UI

Some UI components in `src/components/ui/` are adapted from
[Opensource UI](https://opensourceui.in) (`github.com/bidyut10/opensourceui`).
Each adapted file names its source component in a header comment.

```
MIT License

Copyright (c) 2026 Bidyut Kundu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

| Tripcelona file                          | Adapted from                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/ui/button.tsx`           | `buttons/soft-pill-button`                                                                                                                       |
| `src/components/ui/field.tsx`            | `inputs/text-field-input`, `textarea-field-input`, `select-field-input`, `checkbox-field-input`, `radio-group-field-input`, `switch-field-input` |
| `src/components/ui/quantity-stepper.tsx` | `buttons/quantity-stepper-button`                                                                                                                |
| `src/components/ui/spinner.tsx`          | `loaders/spin-loader`                                                                                                                            |

## Preline UI

The admin panel layout and building blocks (application sidebar, top bar, card with header and footer, table in a card, stat cards, soft status badges, underline tabs) are adapted from Preline UI, https://github.com/htmlstreamofficial/preline (https://preline.co). Only markup and class patterns were adapted; the Preline JavaScript plugins and theme colours are not used, and Tripcelona colour tokens replace the Preline theme. Preline UI is released under the MIT License and the Preline UI Fair Use License, reproduced in full below.

| Tripcelona file                              | Adapted from                               |
| -------------------------------------------- | ------------------------------------------ |
| `src/app/admin/(panel)/layout.tsx`           | Application layout with sidebar and header |
| `src/components/admin/admin-nav.tsx`         | Sidebar navigation                         |
| `src/components/admin/ui.tsx`                | Card, Tables, Badge, Stats                 |
| `src/app/admin/(panel)/solicitudes/page.tsx` | Tabs (underline), Button group             |

```text
@Author: Preline Labs Ltd.
@Website: https://preline.co
@License: Preline UI is free for both personal and commercial projects, released under dual license terms "MIT" and "Preline UI Fair Use License", and copyrighted 2026 by Preline Labs Ltd.

MIT License

Copyright (c) 2026 Preline Labs Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


Preline UI Fair Use License

1. Usage Restrictions:
- Competing Products: The Software shall not be used to create any product or service that directly competes with Preline UI. A competing product is defined as any software or service that replicates the primary functionalities of Preline UI.
- Misuse and Abuse: The Software shall not be used for any activities that are deemed harmful, abusive, or intended to deceive end-users. This includes, but is not limited to, creating malware, engaging in fraudulent activities, or infringing on the rights of others.

2. Commercial Derivative Works:
Users are permitted to create and sell derivative works such as templates, themes, and page builders, provided that:
- The derivative works must not be marketed as competing products.
- Proper attribution must be given to the original author, including the name "Preline UI" and a link to the original repository.
- A clear distinction must be made between the original work and the derivative work, ensuring that users understand the source of each.

3. Distribution and Sublicensing:
Redistribution of the Software in its original or modified form is allowed under the MIT License, with the following additional conditions:
- Redistributions must include this Fair Use License in addition to the MIT License.
- Redistributions must not remove or alter any licensing information or notices.
- Must include clear attribution with a link to the original repository.

4. Termination:
The author reserves the right to terminate the rights granted under this Fair Use License if the user fails to comply with the terms. Upon termination, the user must cease all use and distribution of the Software, and destroy all copies in their possession.

5. Enforcement and Compliance:
- Users who believe that the terms of this Fair Use License have been violated are encouraged to report the violation to the author.
- The author reserves the right to take legal action to enforce compliance with this Fair Use License.
```

## Untitled UI React (MIT)

Source: https://github.com/untitleduico/react. The open-source components are vendored in
`src/components/uui/` (sidebar navigation, table, charts base, empty state, file upload,
loading indicator, carousel, tabs, modal, pagination, badges, buttons, progress indicators,
featured icon, avatar and their dependencies), and the design tokens are in
`src/styles/untitled-theme.css`. Changes: import paths, Prettier formatting, Spanish UI
strings in the file uploader, and the purple brand scale swapped for the Tripcelona
navy/blue. Admin wrappers in `src/components/admin/` reuse their class lists. The PRO page
templates (login split carousel, settings, dashboards) were **not** used. Those admin pages
were written from scratch in the same layout style. The full licence text is in
`src/components/uui/LICENSE`:

```text
MIT License

Copyright (c) 2025 Untitled UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Tour photos: Christmas trips (Wikimedia Commons)

Resized to 1600px. Credited on each tour page under "Créditos de las fotos".

- `public/photos/tours/village-de-noel-le-barcares/01.jpg`: Decoración navideña junto al paquebote Lydia, Le Barcarès. Anthony Levrot, CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0). Source: https://commons.wikimedia.org/wiki/File:Le_Barcar%C3%A8s_-_66420_-_2024.01.17_D%C3%A9corations_de_No%C3%ABl_au_pied_du_%C2%AB_Lydia_%C2%BB_%C2%A9_Anthony_Levrot.jpg
- `public/photos/tours/village-de-noel-le-barcares/02.jpg`: El paquebote Lydia en el paseo marítimo de Le Barcarès. Anthony Levrot, CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0). Source: https://commons.wikimedia.org/wiki/File:%22Lydia%22_(vue_avant_droite)_-_Le_Barcar%C3%A8s,_2018.jpg
- `public/photos/tours/village-de-noel-le-barcares/03.jpg`: Barcas catalanas en el puerto de Le Barcarès. Alan Mattingly, CC0 (http://creativecommons.org/publicdomain/zero/1.0/deed.en). Source: https://commons.wikimedia.org/wiki/File:Barques_catalanes_Le-Barcar%C3%A8s.jpg
- `public/photos/tours/village-de-noel-le-barcares/04.jpg`: Puerto deportivo de Port-Barcarès con el Canigó nevado al fondo. Martine SODAIGUI, CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0). Source: https://commons.wikimedia.org/wiki/File:MRSBarca41.jpg
- `public/photos/tours/village-de-noel-le-barcares/05.jpg`: Mercado navideño de noche (foto ilustrativa, Lyon). Florian Pépellin, CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0). Source: https://commons.wikimedia.org/wiki/File:March%C3%A9_de_No%C3%ABl_de_Lyon_au_soir_du_8_d%C3%A9cembre_2017.JPG
- `public/photos/tours/village-de-noel-le-barcares/06.jpg`: Pista de hielo en un mercado navideño (foto ilustrativa, Estrasburgo). Pierre Rudloff, Public domain (https://commons.wikimedia.org/wiki/Commons:Public_domain). Source: https://commons.wikimedia.org/wiki/File:Patinoire_march%C3%A9_de_No%C3%ABl_Strasbourg.JPG
- `public/photos/tours/andorra-la-vella-mercado-de-navidad/01.jpg`: Árbol de Navidad iluminado en la plaça de la Rotonda, Andorra la Vella. FrankAndProust, CC0 (http://creativecommons.org/publicdomain/zero/1.0/deed.en). Source: https://commons.wikimedia.org/wiki/File:Pla%C3%A7a_de_la_Rotonda_Christmas_Tree_20231128_173438.jpg
- `public/photos/tours/andorra-la-vella-mercado-de-navidad/02.jpg`: Avinguda Meritxell con luces de Navidad, Andorra la Vella. FrankAndProust, CC0 (http://creativecommons.org/publicdomain/zero/1.0/deed.en). Source: https://commons.wikimedia.org/wiki/File:Avinguda_Meritxell_Christmas_decorations_20231128_174025.jpg
- `public/photos/tours/andorra-la-vella-mercado-de-navidad/03.jpg`: Casa de la Vall y Consell General, Andorra la Vella. FrankAndProust, CC0 (http://creativecommons.org/publicdomain/zero/1.0/deed.en). Source: https://commons.wikimedia.org/wiki/File:Casa_de_la_Vall_and_Consell_General_d%27Andorra_20231128_075456.jpg
- `public/photos/tours/andorra-la-vella-mercado-de-navidad/04.jpg`: Iglesia de Sant Esteve en el casco antiguo de Andorra la Vella. FrankAndProust, CC0 (http://creativecommons.org/publicdomain/zero/1.0/deed.en). Source: https://commons.wikimedia.org/wiki/File:Sant_Esteve_Andorra_la_Vella_20231008_121913.jpg
- `public/photos/tours/andorra-la-vella-mercado-de-navidad/05.jpg`: Balneario de Caldea junto al río Valira, Escaldes-Engordany. FrankAndProust, CC0 (http://creativecommons.org/publicdomain/zero/1.0/deed.en). Source: https://commons.wikimedia.org/wiki/File:Caldea_20231205_122111.jpg
- `public/photos/tours/andorra-la-vella-mercado-de-navidad/06.jpg`: Esquiadores bajo las cumbres nevadas del Pirineo andorrano. Jrodriguez9, CC0 (http://creativecommons.org/publicdomain/zero/1.0/deed.en). Source: https://commons.wikimedia.org/wiki/File:Andorra-snow-1940194.jpg
