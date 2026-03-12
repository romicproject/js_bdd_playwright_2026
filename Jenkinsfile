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

    stage('Build Info') {
      steps {
        echo 'Docker image build is included in npm docker:test:* scripts via --build'
      }
    }

    stage('Run Tests') {
      steps {
        sh "npm run docker:test:${params.TEST_ENV}"
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
