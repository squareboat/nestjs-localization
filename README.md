# Nestjs Localization

Nestjs localization provides a convenient way to retrieve strings in various languages, allowing you to easily support multiple languages within your application.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Static Import](#static-import)
  - [Dynamic Import](#dynamic-import)
- [Defining Translation Strings](#defining-translation-strings)
- [Retrieving Translation Strings](#retrieving-translation-strings)
- [Replacing Parameters In Translation Strings](#replacing-parameters-in-translation-strings)
- [Pluralization](#pluralization)
- [Contributing](#contributing)
- [About Us](#about-us)
- [License](#license)

## Installation

To install the package, run :

`npm i nestjs-localization`

Or if you are using yarn

`yarn add nestjs-localization`

## Getting Started

Language strings may be stored in files within the a directory. Within this directory, the translation strings are to be defined in JSON files.When taking this approach, each language supported by your application would have a corresponding JSON file within this directory. This approach is recommended for application's that have a large number of translatable strings.

We would recommend you to store the files in `resources/lang` directory. Also, it is recommended to name your language files using the language <a href="https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes">ISO-2</a> codes.You need to pass the absolute path to the directory you decide to store your files in, while registering the module.

Recommended directory structure :

```
/resources
    /lang
        en.json
        es.json
/src
package.json
```

Once you have the `nestjs-localization` package installed in your project. You'll need to import the module into your application. You can import the module statically or dynamically.

#### Static Import

To import the module statically, you can do

```javascript
import { Module } from '@nestjs/common';
import { LocalizationModule } from '@lib/localization';

@Module({
  imports: [
    LocalizationModule.register({
      path: 'absolute/path/to/your/resource/directory',
    }),
  ],
})
export class AppModule {}
```

#### Dynamic Import

To import the module dynamically, create a configuration and load it into your `Config Module`. Read about it <a href='https://docs.nestjs.com/techniques/configuration#configuration-namespaces'>here.</a>

```javascript
import { registerAs } from '@nestjs/config';

export default registerAs('localization', () => ({
  path: 'absolute/path/to/your/resource/directory',
}));
```

Now that the configuration is loaded, you can import your module asynchronously.

```javascript
import { Module } from '@nestjs/common';
import { LocalizationModule } from '@lib/localization';

@Module({
  imports: [
    LocalizationModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => config.get('localization'),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Defining Translation Strings

Typically, translation strings are stored in files within the resources/lang directory. Within this directory you'll have JSON files contianing the key value pairs for a particular language.
For example, if your application has a English translation, you should create a `resources/lang/en.json` file:

```json
// en.json

{
  "welcome": "Welcome to this application",
  "helloWorld": "Hello World"
}
```

For applications with a large number of translatable strings, defining every string with a "short key" can become confusing when referencing the keys in your views and it is cumbersome to continually invent keys for every translation string supported by your application.
For example, if your application has a German translation, you should create a `resources/lang/de.json` file:

```json
// de.json

{
  "Have a good day": "Haben Sie einen guten Tag"
}
```

Also, you can nest your strings inside the json file.
Example :

```json
// en.json

{
  "greetings": {
    "morning": "Good Morning",
    "evening": "Good Evening"
  }
}
```

> **NOTE** You should not create conflicting keys i.e 2 keys should not have the same name.

### Retrieving Translation Strings

You may retrieve translation strings from your language files using the `__` helper function. The `__` function takes 2 required arguments, the key of the translation string you wish of retrive and the language code. You can use `.` the dot notation to refer to nested strings.

```javascript
__(key: string, language: string, options?: Record<string, any>): string
```

Examples :

```javascript
__('helloWorld', 'en');           // returns => Hello World
__('Have a good day', 'de');      // returns => Haben Sie einen guten Tag
__('greetings.morning', 'en');    // returns => Good Morning
__('randomKey', 'en');            // returns => ERR::INVALID KEY ==> randomKey
```

### Replacing Parameters In Translation Strings

If you wish, you may define placeholders in your translation strings. All placeholders are prefixed with a `:`. For example, you may define a personalized hello message with a placeholder name:

```json
// en.json

{
  "hello": "Hello, :name"
}
```

To replace the placeholders when retrieving a translation string, you may pass an array of replacements as the second argument to the `__` function:

```javascript
__('hello', 'en', { name: 'jeo' }); // returns => Hello, jeo
```

If your placeholder contains all capital letters, or only has its first letter capitalized, the translated value will be capitalized accordingly:

```json
"hello": "Hello, :Name"      // Hello, Jeo
  // OR
"hello": "Hello, :NAME"     // Hello, JEO
```

## Pluralization

Pluralization is a complex problem, as different languages have a variety of complex rules for pluralization; however, `nestjs-localization` can help you translate strings differently based on pluralization rules that you define. Using a `|` character, you may distinguish singular and plural forms of a string:

```json
"apples" : "There is one apples|There are many apples"
```

You may even create more complex pluralization rules which specify translation strings for multiple ranges of values:

```json
"apples": "[0] There is no apple|[1,10] There are some apples|[11,*] There are many apples",
```

After defining a translation string that has pluralization options, you may use the `transChoice` function to retrieve the line for a given "count".

```javascript
transChoice(
  key: string,
  language: string,
  count: number,
  options?: Record<string, any>,
): string
```

In this example, since the count is greater than one, the plural form of the translation string is returned:

```javascript
transChoice('apples', 'en', 10); // returns => There are some apples
```

You may also define placeholder attributes in pluralization strings. These placeholders may be replaced by passing an array as the third argument to the `transChoice` function:

```json
// en.json

{
  "time": {
    "minutes_ago": "[1] :value minute ago|[2,*] :value minutes ago"
  }
}
```

```javascript
transChoice('time.minutes_ago', 'en', 5, { value: 5 }); // returns => 5 minutes ago
```

If you would like to display the integer value that was passed to the `transChoice` function, you may use the built-in `:count` placeholder:

```json
// en.json

{
  "apples": "[0] There are none|[1] There is one|[2,*] There are :count apples"
}
```

```javascript
transChoice('apples', 'en', 30); // returns => There are 30 apples
```

## Contributing

To know about contributing to this package, read the guidelines [here](./CONTRIBUTING.md)

## About Us

We are a bunch of dreamers, designers, and futurists. We are high on collaboration, low on ego, and take our happy hours seriously. We'd love to hear more about your product. Let's talk and turn your great ideas into something even greater! We have something in store for everyone. [☎️ 📧 Connect with us!](https://squareboat.com/contact)

## License

The MIT License. Please see License File for more information. Copyright © 2020 SquareBoat.

Made with ❤️ by [Squareboat](https://squareboat.com)
