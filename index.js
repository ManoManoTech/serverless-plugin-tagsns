'use strict';

class ServerlessPlugin {
  constructor(serverless, options) {
    this._serverless = serverless;
    this._provider = serverless.getProvider('aws');
    this._log = msg => {options.verbose && serverless.cli.log(msg);};

    this.hooks = {
      'after:aws:deploy:deploy:updateStack': this.afterDeployStack.bind(this),
    };
  }

  afterDeployStack() {
    this._serverless.cli.log("SNS tagging start...");
    const stackName = this._provider.naming.getStackName();
    this._log(`Stack name ${stackName}`);

    let topics = [];

    /* Get the topic tags from the configuration */
    this._serverless.service.getAllFunctions().forEach(functionName => {
      const functionObj = this._serverless.service.getFunction(functionName);

      if (!("events" in functionObj)) {
        return;
      }
      functionObj.events.forEach(event => {
        if (! "sns" in event) {
          return;
        }
        let topicArn;
        let topicName;
        let tags;
        let topicLogicalId;
        if (typeof event.sns === 'object') {
          if (event.sns.arn) {
            topicArn = event.sns.arn;
            const splitArn = topicArn.split(':');
            topicName = splitArn[splitArn.length - 1];
            topicName = event.sns.topicName || topicName;
          } else {
            topicName = event.sns.topicName;
          }
          tags = Object.assign({}, this._serverless.service.provider.tags, event.sns.tags);
          topicLogicalId = this._provider.naming.getTopicLogicalId(topicName)
          topics.push({"name": topicLogicalId, 'tags':tags});
        } else if (typeof event.sns === 'string') {
          if (event.sns.indexOf('arn:') === 0) {
            topicArn = event.sns;
            const splitArn = topicArn.split(':');
            topicName = splitArn[splitArn.length - 1];
          } else {
            topicName = event.sns;
          }
          tags = Object.assign({}, this._serverless.service.provider.tags);
          topicLogicalId = this._provider.naming.getTopicLogicalId(topicName)
          topics.push({"name": topicLogicalId, 'tags':tags});
        }
      });
      this._log(`${topics.length} topics found in serverless conf`);
    });

    /* Get the deployed SNS (mainly to get the arn for created Topics */
    this._provider
      .request('CloudFormation', 'listStackResources', { StackName: stackName })
      .then(result => {
        if (result) {
          let AWS_topics = result.StackResourceSummaries.filter(a => { return a.ResourceType == "AWS::SNS::Topic"});
          this._log(`${topics.length} topics found into AWS`);
          AWS_topics.forEach(AWS_topic => {
            let topic = topics.find(t => {return t.name == AWS_topic.LogicalResourceId})
            if (topic == undefined) {
              this._log("Not tag found for ${AWS_topic.LogicalResourceId}");
              return;
            }
            let tags = topic.tags;
            if (tags.length == 0) return;
            this._log(`Tagging ${AWS_topic.LogicalResourceId}`);
            this._provider.request('SNS', 'tagResource',
                                   {
                                     ResourceArn: AWS_topic.PhysicalResourceId,
                                     Tags: Object.keys(tags).map(k => ({Key:k, Value:tags[k]}))
                                   });
          });
        }
        this._serverless.cli.log("SNS tagging finished...");
      });
  }
}

module.exports = ServerlessPlugin;
