# Obsidian Plugin
Personal Plugin to change a heading to a clean embed of its own note.
Requires this [Embed Adjustments Snippet](https://github.com/SlRvb/Obsidian--ITS-Theme/blob/main/Snippets/S%20-%20Embed%20Adjustments.css) from the [Obsidian--ITS-Theme](https://publish.obsidian.md/slrvb-docs/ITS+Theme/ITS+Theme)

Example:
Temperature.md
```
# Temperature
## Definition
Temperature is a physical quantity that quantitatively expresses the attribute of hotness or coldness
## Temperature Scales
### Fahrenheit
The Fahrenheit scale is a temperature scale based on one proposed in 1724 by the European physicist Daniel Gabriel Fahrenheit
### Celsius
The degree Celsius is the unit of temperature on the Celsius temperature scale, one of two temperature scales used in the International System of Units (SI), the other being the closely related Kelvin scale.
```


If you right-click on `##Temperature Scales` and select "Extract Heading (with embed)" then the following file, `Temperature Scales.md` would be created:

Temperature Scales.md
```
# Temperature Scales
## Fahrenheit
The Fahrenheit scale is a temperature scale based on one proposed in 1724 by the European physicist Daniel Gabriel Fahrenheit
## Celsius
The degree Celsius is the unit of temperature on the Celsius temperature scale, one of two temperature scales used in the International System of Units (SI), the other being the closely related Kelvin scale.
```

After `Temperature Scales.md` is created, then `Temperature.md` would be the following:

Temperature.md
```
# Temperature
## Definition
Temperature is a physical quantity that quantitatively expresses the attribute of hotness or coldness
## Temperature Scales
![[Temperature Scales.md | no-h1 no-title no-inline-title ]]
```