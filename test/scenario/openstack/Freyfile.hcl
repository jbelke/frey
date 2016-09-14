"global" "terraformcfg" {
  "parallelism" = 1
}

"global" "ansiblecfg" "defaults" {
  "remote_user" = "root"

  "host_key_checking" = "False"
}

"global" "ansiblecfg" "ssh_connection" {
  "ssh_args" = "-oControlMaster=auto -oControlPersist=60s -oUserKnownHostsFile=/dev/null -oStrictHostKeyChecking=no"
}

"infra" "output" "public_address" {
  "value" = "${openstack_compute_instance_v2.freytest_app.access_ip_v4}"
}

"infra" "output" "public_addresses" {
  "value" = "${openstack_compute_instance_v2.freytest_app.access_ip_v4}"
}

"infra" "provider" "openstack" {
  "tenant_name" = "${var.FREY_OPENSTACK_TENANT_NAME}"

  "user_name" = "${var.FREY_OPENSTACK_PROJECT_NAME}"

  "password" = "${var.FREY_OPENSTACK_PASSWORD}"

  "auth_url" = "${var.FREY_OPENSTACK_AUTH_URL}"
}

"infra" "resource" "openstack_compute_keypair_v2" "freytest" {
  "name" = "freytest"

  "public_key" = "${file(\"{{{config.global.ssh.publickey_file}}}\")}"
}

"infra" "resource" "openstack_networking_network_v2" "freytest" {
  "admin_state_up" = "true"

  "name" = "freytest"

  "depends_on" = ["openstack_compute_keypair_v2.freytest"]
}

"infra" "resource" "openstack_networking_subnet_v2" "freytest" {
  "cidr" = "10.0.0.0/24"

  "dns_nameservers" = ["8.8.8.8", "8.8.4.4"]

  "ip_version" = 4

  "network_id" = "${openstack_networking_network_v2.freytest.id}"

  "name" = "freytest"

  "depends_on" = ["openstack_compute_secgroup_v2.freytest"]
}

"infra" "resource" "openstack_networking_router_v2" "freytest" {
  "admin_state_up" = "true"

  "external_gateway" = "${var.FREY_OPENSTACK_EXTERNAL_GATEWAY}"

  "name" = "freytest"

  "depends_on" = ["openstack_networking_subnet_v2.freytest"]
}

"infra" "resource" "openstack_networking_router_interface_v2" "freytest_app" {
  "router_id" = "${openstack_networking_router_v2.freytest.id}"

  "subnet_id" = "${openstack_networking_subnet_v2.freytest.id}"
}

"infra" "resource" "openstack_compute_floatingip_v2" "freytest_app" {
  "depends_on" = ["openstack_networking_router_interface_v2.freytest_app"]

  "pool" = "public"
}

"infra" "resource" "openstack_compute_secgroup_v2" "freytest" {
  "depends_on" = ["openstack_networking_network_v2.freytest"]

  "name" = "freytest"

  "description" = "freytest"

  "rule" = {
    "cidr" = "0.0.0.0/0"

    "from_port" = -1

    "ip_protocol" = "icmp"

    "to_port" = -1
  }

  "rule" = {
    "cidr" = "0.0.0.0/0"

    "from_port" = 22

    "ip_protocol" = "tcp"

    "to_port" = 22
  }
}

"infra" "resource" "openstack_compute_instance_v2" "freytest_app" {
  "flavor_name" = "m1.small"

  "floating_ip" = "${openstack_compute_floatingip_v2.freytest_app.address}"

  "image_name" = "ubuntu14.04-LTS"

  "key_pair" = "${openstack_compute_keypair_v2.freytest.name}"

  "name" = "freytest_app"

  "security_groups" = ["${openstack_compute_secgroup_v2.freytest.name}"]

  "network" = {
    "uuid" = "${openstack_networking_network_v2.freytest.id}"
  }

  "provisioner" "remote-exec" {
    "inline" = ["sudo pwd"]

    "connection" = {
      "key_file" = "{{{config.global.ssh.privatekey_file}}}"

      "user" = "{{{config.global.ssh.user}}}"
    }
  }
}

"install" = {
  "playbooks" = {
    "hosts" = "freytest_app"

    "name" = "install app servers"

    "tasks" = {
      "name" = "Execute install command"

      "command" = "{{item}}"

      "with_items" = ["pwd", "echo install"]
    }
  }
}

"setup" = {
  "playbooks" = {
    "hosts" = "freytest_app"

    "name" = "setup app servers"

    "tasks" = {
      "name" = "Execute setup command"

      "command" = "{{item}}"

      "with_items" = ["pwd", "echo setup"]
    }
  }
}

"deploy" = {
  "playbooks" = {
    "hosts" = "freytest_app"

    "name" = "deploy app servers"

    "tasks" = {
      "name" = "Execute deploy command"

      "command" = "{{item}}"

      "with_items" = ["pwd", "echo deploy"]
    }
  }
}

"restart" = {
  "playbooks" = {
    "hosts" = "freytest_app"

    "name" = "restart app servers"

    "tasks" = {
      "name" = "Execute restart command"

      "command" = "{{item}}"

      "with_items" = ["pwd", "echo restart"]
    }
  }
}
