# Reading the registry from Terraform

Terraform does not list the Lambdas: it walks `backend/functions.json`. Adding a function is adding an entry
to the registry; the Lambda, its route and its permissions appear together. Illustrative sketch (adjust to the
real jar name and to the modules defined in `infrastructure/`):

```hcl
locals {
  # Only what is implemented: "planned" functions have no jar to deploy yet.
  functions      = { for f in jsondecode(file("${path.module}/../backend/functions.json")).functions : f.name => f if try(f.status, "implemented") == "implemented" }
  http_functions = { for name, f in local.functions : name => f if f.trigger.type == "http" }
  sqs_functions  = { for name, f in local.functions : name => f if f.trigger.type == "sqs" }
  # authorizer -> aws_apigatewayv2_authorizer; schedule -> aws_cloudwatch_event_rule; s3 -> aws_s3_bucket_notification
}

resource "aws_lambda_function" "this" {
  for_each      = local.functions
  function_name = "${var.prefix}-${each.key}"
  runtime       = "java21"
  handler       = each.value.handler
  memory_size   = try(each.value.memoryMb, 512)
  timeout       = try(each.value.timeoutSeconds, 15)
  reserved_concurrent_executions = try(each.value.reservedConcurrency, -1)
  # filename / source_code_hash: the jar of the module backend/<service>/
}

resource "aws_apigatewayv2_route" "this" {
  for_each  = local.http_functions
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "${each.value.trigger.method} ${each.value.trigger.path}"
  target    = "integrations/${aws_apigatewayv2_integration.this[each.key].id}"
}
```

`uses` becomes per-function IAM policies (`read` -> `GetItem/Query`, `write` -> `PutItem/UpdateItem`,
`readwrite` -> both) scoped to the ARN of that table or bucket. `publishes` grants `events:PutEvents` (or
`sns:Publish`) and `sqs` triggers grant consuming their queue.

## AWS Academy

The lab cannot create IAM roles: every function uses `LabRole`. The registry is still useful (it documents the
least privilege that would be applied and feeds the "Permissions per function" table), but in Terraform you must
use `role = data.aws_iam_role.lab.arn` instead of creating one role per function. Note it in
`infrastructure/README.md` as a conscious simplification (see ADR-0001).
