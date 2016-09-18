global {
  connection = "local"
  terraformcfg {
    parallelism = 1
  }
  ansiblecfg ssh_connection {
    ssh_args = "-o Hostname={{{config.global.connection}}}host -o ControlMaster=auto -o ControlPersist=60s"
  }
}

infra provider aws {
  access_key = "${var.FREY_AWS_ACCESS_KEY}"
  region     = "us-east-1"
}

install playbooks {
  tasks {
    name    = "Execute arbitrary command"
    command = "pwd"
  }
}

