# serverless-plugin-tagsns
A serverless plugin to tag SNS Topics on AWS

## Features
 * Tag the sns topics
 * Use provider tags and events.sns tags

## Instalation

```
yarn add serverless-plugin-tagsns
```

then add it in your plugins list:

```
plugins:
  - serverless-plugin-tagsns
  ```

## Tags Configuration

Using the tags configuration makes it possible to add key / value tags to your SNS Topic.

Those tags will appear in your AWS console and make it easier for you to group functions by tag or find functions with a common tag.
```
functions:
  hello:
    handler: handler.hello
    events:
      - sns:
          topicName: aggregate
          displayName: Data aggregation pipeline
          tags:
              foo: bar
```
Or if you want to apply tags configuration to all topics in your service, you can add the configuration to the higher level provider object. Tags configured at the sns level are merged with those at the provider level, so your topic with specific tags will get the tags defined at the provider level. If a tag with the same key is defined at both the function and provider levels, the function-specific value overrides the provider-level default value. For example:

```
# serverless.yml
service: service-name
provider:
  name: aws
  tags:
    foo: bar
    baz: qux
functions:
  hello:
    handler: handler.hello
    events:
      - sns:
          topicName: aggregate
          displayName: Data aggregation pipeline
          tags:
              foo: quux
```
## License
MIT
