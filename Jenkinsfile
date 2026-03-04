pipeline {
  agent { label 'docker' }

  parameters {
    choice(
      name: 'TEST_ENV',
      choices: ['dev', 'staging', 'prod'],
      description: 'Target environment/profile for Docker Compose test run'
    )
  }

  options {
    ansiColor('xterm')
    timestamps()
    timeout(time: 60, unit: 'MINUTES')
    skipStagesAfterUnstable()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Preflight') {
      steps {
        sh 'docker --version'
        sh 'docker compose version'
      }
    }

    stage('Build Image') {
      steps {
        sh "docker compose --profile ${params.TEST_ENV} build"
      }
    }

    stage('Run Tests') {
      steps {
        sh "docker compose --profile ${params.TEST_ENV} up --build --abort-on-container-exit --exit-code-from tests-${params.TEST_ENV} --remove-orphans"
      }
    }
  }

  post {
    always {
      junit testResults: 'out/test-results/junit.xml', allowEmptyResults: true
      archiveArtifacts artifacts: 'out/playwright-report/**,out/test-results/**', allowEmptyArchive: true
      sh 'docker compose down --remove-orphans || true'
    }
  }
}
