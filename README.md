uberCad
=======

### What is uberCad?

uberCad is browser DXF-editor. It's simple and usefull, have a lot of features and possibilities.
uberCad not only editor but multi-user app with personal page of projects, collaboration and big library of presets. 

### Why is this project useful?

This project will be usefull for many other projects like CAD-systems, CNC-routers, modelling and other.

### uberCad in glance

[todo]

### Team

Initially uberCad is the product of http://thermevo.com
Currently we are developing opensource product with lovely community 

### We need you 

If you have a vision of how to make the world better and improve the project then join the uberCad team.
Feel free to create pull requests and issues!

### How do I get started?

Just clone this repository and modify it as you want. Than create pull request and we'll comunicate. 

### Where can I get more help, if I need it?

If you need more info, visit http://thermevo.com/ubercad/en

### Build docker image 

```
docker image build -t shus/cra-docker:latest .
docker images
docker tag 6c763f716e3e shus/cra-docker:latest
docker push shus/cra-docker
```

### Deploy docker image

```
docker-compose stop
docker pull shus/cra-docker:latest
docker-compose -f docker-compose.yml up -d
```