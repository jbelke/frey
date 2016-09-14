"infra" resource aws_dynamodb_table "basic-dynamodb-table" {
  hash_key       = "UserId"
  name           = "GameScores"
  range_key      = "GameTitle"
  read_capacity  = 20
  write_capacity = 20
  attribute {
    name = "TopScore"
    type = "N"
  }
  attribute {
    name = "UserId"
    type = "N"
  }
  attribute {
    name = "GameTitle"
    type = "S"
  }
  global_secondary_index {
    hash_key           = "GameTitle"
    name               = "GameTitleIndex"
    non_key_attributes = ["UserId"]
    projection_type    = "INCLUDE"
    range_key          = "TopScore"
    read_capacity      = 10
    write_capacity     = 10
  }
}

