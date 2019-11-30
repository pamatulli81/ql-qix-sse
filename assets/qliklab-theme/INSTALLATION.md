__NOTE: You may need to change program installation path, as well as the theme path__.

# App Overrides Installation

1. Run the following command in cmd.exe with admin rights:

```bash
mklink /d "C:\Users\me\AppData\Local\Programs\Qlik\Sense-Desktop\Client\qliklab-theme" "P:\qliklab\qlik\qliklab-theme\"
```

2. Paste the following HTML after the last `<link` tag in the following files:

  - `C:\Users\me\AppData\Local\Programs\Qlik\Sense-Desktop\Client\hub.html`
  - `C:\Users\me\AppData\Local\Programs\Qlik\Sense-Desktop\Client\client.html`

```html
<link rel="stylesheet" href="../resources/qliklab-theme/dist/app-overrides.css">
```

# App Icon Installation

1. Delete the following folder: `C:\Users\me\Documents\Qlik\Sense\Content\Default`.
2. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Content\Default" "P:\qliklab\qlik\qliklab-theme\static\app-icons"
```

# Theme Installation

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-theme" "P:\qliklab\qlik\qliklab-theme\"
```

# Extension Installation

## Sense Navigation

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-sense-navigation" "P:\qliklab\qlik\extensions\qliklab-sense-navigation\"
```

## D3 Chart

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-d3-cart" "P:\qliklab\qlik\extensions\qliklab-d3-chart\"
```

## Climber KPI

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-climber-kpi" "P:\qliklab\qlik\extensions\qliklab-climber-kpi\"
```

## Stock Market Ticker

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-customer-info" "P:\qliklab\qlik\extensions\qliklab-customer-info\"
```

## Variable

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-variable" "P:\qliklab\qlik\extensions\qliklab-variable\"
```

## Link List

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-link-list" "P:\qliklab\qlik\extensions\qliklab-link-list\"
```

## Sense Tabs

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-sense-tabs" "P:\qliklab\qlik\extensions\qliklab-sense-tabs\"
```

## Sense Export

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-sense-export" "P:\qliklab\qlik\extensions\qliklab-sense-export\"
```

## Horizontal Line

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-horizontal-line" "P:\qliklab\qlik\extensions\qliklab-horizontal-line\"
```

## WYSIWYG

1. Run the following in cmd.exe with admin rights:

```bash
mklink /D "C:\Users\me\Documents\Qlik\Sense\Extensions\qliklab-static-text" "P:\qliklab\qlik\extensions\qliklab-static-text\"
```