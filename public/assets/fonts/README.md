# Licensed design fonts

Pixel-identical Figma rendering requires the licensed webfont files below:

- `gilroy-regular.woff2`
- `gilroy-medium.woff2`
- `gilroy-semibold.woff2`
- `gilroy-bold.woff2`
- `gilroy-regular-italic.woff2`
- `tt-norms-pro-bold.woff2`

These commercial fonts are intentionally not redistributed by this repository. Add licensed
copies using the exact filenames above, then run `npm run fonts:verify` before the visual suite.

## Obtaining the fonts

Do not download these fonts from unauthorized redistribution sites. Obtain the appropriate
webfont licenses from the official foundries or an authorized reseller:

- [Gilroy on MyFonts](https://www.myfonts.com/collections/gilroy-font-radomir-tinkov?tab=licensing)
- [TT Norms Pro from TypeType](https://typetype.org/fonts/tt-norms-pro/)
- [TT Norms Pro trial request](https://typetype.org/trial-fonts/) for evaluation only

After downloading licensed copies, place the WOFF2 files in this directory and rename them to
the exact filenames listed above. On Windows, verify the installation with:

```powershell
npm.cmd run fonts:verify
```

The verifier should report `All licensed Figma fonts are present and valid WOFF2 files.` before
running visual-regression tests. If licensed copies are unavailable, use open-source substitute
fonts instead; substitutions will not produce pixel-identical Figma renders.
