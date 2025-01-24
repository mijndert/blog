---
title: Avoid using internal load balancers
date: 2022-03-15 10:00:00
summary: On avoiding internal load balancers in liue of AWS CloudMap.
tags: aws
---

One of the most well-known patterns in infrastructure is having an internal load balancer in front of backend services like application servers. When you're migrating your workloads to say AWS Fargate it's easy to just carry over that same pattern because, well, it works. But, as with all things in the cloud, internal load balancers cost money and add complexity. When you're just migrating to using containers for the first time, adding complexity to an already steep learning curve might not be the best way to go about things.

That's where _Service Discovery_ comes in.

Service Discovery is a thing where you let the backend servers register themselves in some kind of database, so the requestor knows where the targets are. This has been done in all kinds of scenarios; from DHCP to XMPP, as well as DNS in Kubernetes.

While I agree that adding Service Discovery to your architecture does add a little bit of an up-front learning curve, in the long run it's kind of a set-and-forget thing.

A great service for such a use-case is [AWS CloudMap](https://aws.amazon.com/cloud-map/) which integrates really well with AWS Fargate. Say you have a backend service running on AWS Fargate that accepts traffic on port 4000 that you can to be able to horizontally scale, it's pretty easy to implement in CloudFormation.

First we need to create a namespace to register targets in.

```yml
PrivateNamespace:
  Type: AWS::ServiceDiscovery::PrivateDnsNamespace
  Properties:
    Name: my-backend-service.aws
    Vpc: !Ref VPCId
```

Now we can create a Service which is a collection of backend servers that Fargate knows how to register itself into.

```yml
DiscoveryService:
  Type: AWS::ServiceDiscovery::Service
  Properties:
    Description: Discovery Service for my-backend-service
    DnsConfig:
      RoutingPolicy: MULTIVALUE
      DnsRecords:
        - TTL: 0
          Type: A
        - TTL: 0
          Type: SRV
    HealthCheckCustomConfig:
      FailureThreshold: 1
    Name: app
    NamespaceId: !Ref PrivateNamespace
```

To connect your Fargate service (`AWS::ECS::Service`) to CloudMap we can simply specify the DiscoveryService resource.

```yml
ServiceRegistries:
  - RegistryArn: !GetAtt DiscoveryService.Arn
    Port: 4000
```

Anyone who needs to access your backend server can now simply use the hostname `app.my-backend-service.aws:4000` without every having to deploy a load balancer.

Of course AWS CloudMap also has the ability to specify exactly which services can access certain backends by integrating IAM into it. But that's for another day to discuss.
