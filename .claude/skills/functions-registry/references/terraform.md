# Leer el registro desde Terraform

Terraform no lista las Lambdas: recorre `backend/functions.json`. Añadir una función es añadir una entrada
al registro; aparecen a la vez la Lambda, su ruta y sus permisos. Esbozo ilustrativo (ajustar al nombre real
del jar y a los módulos que se definan en `infrastructure/`):

```hcl
locals {
  # Solo lo implementado: las funciones "planned" aún no tienen jar que desplegar.
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
  # filename / source_code_hash: el jar del módulo backend/<service>/
}

resource "aws_apigatewayv2_route" "this" {
  for_each  = local.http_functions
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "${each.value.trigger.method} ${each.value.trigger.path}"
  target    = "integrations/${aws_apigatewayv2_integration.this[each.key].id}"
}
```

`uses` se traduce en políticas de IAM por función (`read` → `GetItem/Query`, `write` → `PutItem/UpdateItem`,
`readwrite` → ambas) acotadas al ARN de esa tabla o bucket. `publishes` concede `events:PutEvents` (o
`sns:Publish`) y los disparadores `sqs` conceden el consumo de su cola.

## AWS Academy

El laboratorio no deja crear roles IAM: todas las funciones usan `LabRole`. El registro sigue siendo útil
(documenta el mínimo privilegio que se aplicaría y alimenta la tabla "Permisos por función"), pero en
Terraform hay que usar `role = data.aws_iam_role.lab.arn` en vez de crear un rol por función. Anotarlo en
`infrastructure/README.md` como simplificación consciente, y decidirlo en un ADR si se confirma el entorno.
