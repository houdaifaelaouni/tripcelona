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
