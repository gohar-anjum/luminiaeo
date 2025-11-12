import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "100 keyword analyses/month",
      "Basic semantic scoring",
      "1 project",
      "Community support",
    ],
    current: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    features: [
      "Unlimited keyword analyses",
      "Advanced semantic scoring",
      "5 projects",
      "AI visibility tracking",
      "Priority support",
    ],
    current: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "per month",
    features: [
      "Everything in Pro",
      "Unlimited projects",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    current: false,
  },
];

export default function Billing() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-current-plan">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">Pro</div>
              <Badge>Active</Badge>
            </div>
            <div className="text-muted-foreground">
              $49 per month • Renews on Nov 26, 2024
            </div>
            <div className="flex gap-2">
              <Button variant="outline" data-testid="button-change-plan">Change Plan</Button>
              <Button variant="outline" data-testid="button-cancel-subscription">Cancel Subscription</Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-usage">
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Keyword Analyses</span>
                <span className="font-medium">2,847 / Unlimited</span>
              </div>
              <Progress value={35} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Calls</span>
                <span className="font-medium">12,450 / 50,000</span>
              </div>
              <Progress value={25} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Projects</span>
                <span className="font-medium">3 / 5</span>
              </div>
              <Progress value={60} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.current ? "border-primary shadow-lg" : ""}`}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {plan.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Current Plan
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={plan.current ? "outline" : "default"}
                  disabled={plan.current}
                  data-testid={`button-select-${plan.name.toLowerCase()}`}
                >
                  {plan.current ? "Current Plan" : `Select ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
