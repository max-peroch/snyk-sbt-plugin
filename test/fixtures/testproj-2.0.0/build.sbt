ThisBuild / organization := "com.example"
ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "3.3.3"

Global / onLoadMessage := "loading dependency tree fixture project"

lazy val root = (project in file("."))
  .settings(
    name := "sbt2-app",
    libraryDependencies ++= Seq(
      "com.google.code.gson" % "gson" % "2.6.2",
      "com.fasterxml.jackson.core" % "jackson-databind" % "2.15.2",
      "org.playframework" %% "play-json" % "3.0.4"
    )
  )
