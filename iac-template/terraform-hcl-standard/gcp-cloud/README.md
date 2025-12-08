# GCP Terraform Baseline Configurations

This directory mirrors the AWS IaC layout and provides opinionated YAML definitions for
GCP landing zone and workload resources. Each YAML describes the module source, version,
and default inputs that can be rendered into Terraform variables.

## Layout

- `config/accounts/` — Organization and project bootstrap configuration.
- `config/resources/` — Reusable module inputs for shared VPC, compute, load balancers,
  data stores, and messaging components.

The files follow the same naming convention as the AWS templates so that pipelines can
select matching stacks per cloud provider without additional mapping logic.
