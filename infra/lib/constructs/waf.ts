import { Construct } from "constructs";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { IApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";

export interface WAFProps {
  alb: IApplicationLoadBalancer;
}

type listOfRules = {
  name: string;
  priority: number;
  overrideAction: string;
  excludedRules: string[];
};

export class WafExplorer extends Construct {
  /**
   * Take in list of rules
   * Create output for use in WAF config
   */
  protected makeRules(listOfRules: listOfRules[] = []) {
    var rules: wafv2.CfnRuleGroup.RuleProperty[] = [];

    for (const r of listOfRules) {
      var stateProp: wafv2.CfnWebACL.StatementProperty = {
        managedRuleGroupStatement: {
          name: r["name"],
          vendorName: "AWS",
        },
      };
      var overrideAction: wafv2.CfnWebACL.OverrideActionProperty = { none: {} };

      var rule: wafv2.CfnRuleGroup.RuleProperty = {
        name: r["name"],
        priority: r["priority"],
        // @ts-expect-error Property 'overrideAction' does not exist on type 'CfnRuleGroup.RuleProperty'
        overrideAction: overrideAction,
        statement: stateProp,
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: r["name"],
        },
      };
      rules.push(rule);
    }

    /**
     * The rate limit is the maximum number of requests from a
     * single IP address that are allowed in a five-minute period.
     * This value is continually evaluated,
     * and requests will be blocked once this limit is reached.
     * The IP address is automatically unblocked after it falls below the limit.
     */
    var ruleLimitRequests100: wafv2.CfnWebACL.RuleProperty = {
      name: "LimitRequests100",
      priority: 1,
      action: {
        block: {}, // To disable, change to *count*
      },
      statement: {
        rateBasedStatement: {
          limit: 500,
          aggregateKeyType: "IP",
        },
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "LimitRequests100",
      },
    }; // limit requests to 100
    rules.push(ruleLimitRequests100);

    return rules;
  } // function makeRules

  constructor(scope: Construct, id: string, props: WAFProps) {
    super(scope, id);
    const { alb } = props;
    /**
     * List available Managed Rule Groups using AWS CLI
     * aws wafv2 list-available-managed-rule-groups --scope REGIONAL
     */
    const managedRules: listOfRules[] = [
      {
        name: "AWSManagedRulesCommonRuleSet",
        priority: 10,
        overrideAction: "none",
        excludedRules: [],
      },
      {
        name: "AWSManagedRulesAmazonIpReputationList",
        priority: 20,
        overrideAction: "none",
        excludedRules: [],
      },
      {
        name: "AWSManagedRulesKnownBadInputsRuleSet",
        priority: 30,
        overrideAction: "none",
        excludedRules: [],
      },
      {
        name: "AWSManagedRulesAnonymousIpList",
        priority: 40,
        overrideAction: "none",
        excludedRules: [],
      },
      {
        name: "AWSManagedRulesLinuxRuleSet",
        priority: 50,
        overrideAction: "none",
        excludedRules: [],
      },
      {
        name: "AWSManagedRulesUnixRuleSet",
        priority: 60,
        overrideAction: "none",
        excludedRules: [],
      },
    ];

    // WAF - Regional, for use in Load Balancers
    const wafAclRegional = new wafv2.CfnWebACL(this, "WafRegional", {
      defaultAction: { allow: {} },
      /**
       * The scope of this Web ACL.
       * Valid options: CLOUDFRONT, REGIONAL.
       * For CLOUDFRONT, you must create your WAFv2 resources
       * in the US East (N. Virginia) Region, us-east-1
       */
      scope: "REGIONAL",
      // Defines and enables Amazon CloudWatch metrics and web request sample collection.
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "waf-regional",
        sampledRequestsEnabled: true,
      },
      description: "WAFv2 ACL for Regional Explorer",
      name: "waf-explorer-regional",
      rules: this.makeRules(managedRules),
    }); // wafv2.CfnWebACL

    new wafv2.CfnWebACLAssociation(this, "WafRegionalAssociation", {
      resourceArn: alb.loadBalancerArn,
      webAclArn: wafAclRegional.attrArn,
    });
  } // constructor
} // class
