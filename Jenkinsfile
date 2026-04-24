// Jenkinsfile
// Parallel test lanes (api-mock, api-live-smoke, ui-critical) with Allure
// history preserved across builds via copyArtifacts of the last successful run.

pipeline {
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.58.2-jammy'
      args '-u root:root --ipc=host'
    }
  }

  parameters {
    choice(
      name: 'TEST_ENV',
      choices: ['dev', 'staging', 'prod'],
      description: 'Target environment consumed by env/{ENV}.env'
    )
    booleanParam(
      name: 'SKIP_UI',
      defaultValue: false,
      description: 'Skip UI lane (useful when the UI site is unstable)'
    )
  }

  options {
    ansiColor('xterm')
    timestamps()
    timeout(time: 60, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '10'))
  }

  environment {
    ENV = "${params.TEST_ENV}"
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      steps {
        sh 'node --version'
        sh 'npm --version'
        sh 'npm ci --no-audit --no-fund'
      }
    }

    stage('Quality Gate') {
      steps {
        sh 'npm run check:quality'
      }
    }

    stage('Restore Allure history') {
      steps {
        script {
          try {
            copyArtifacts(
              projectName: env.JOB_NAME,
              selector: lastSuccessful(),
              filter: 'out/allure-history/**',
              fingerprintArtifacts: true,
              optional: true
            )
          } catch (ignored) {
            echo 'No previous Allure history found - starting fresh.'
          }
        }
      }
    }

    stage('Test lanes') {
      parallel {
        stage('api-mock') {
          steps {
            sh 'npm run test:api:mock:ci'
          }
          post {
            always {
              sh 'mkdir -p out/lanes/api-mock'
              sh 'cp -r out/test-results out/lanes/api-mock/test-results || true'
              sh 'cp -r out/playwright-report out/lanes/api-mock/playwright-report || true'
            }
          }
        }

        stage('api-live-smoke') {
          steps {
            sh 'npm run test:api:live:smoke:ci'
          }
          post {
            always {
              sh 'mkdir -p out/lanes/api-live-smoke'
              sh 'cp -r out/test-results out/lanes/api-live-smoke/test-results || true'
              sh 'cp -r out/playwright-report out/lanes/api-live-smoke/playwright-report || true'
            }
          }
        }

        stage('ui-critical') {
          when { expression { return !params.SKIP_UI } }
          steps {
            sh 'npm run test:ui:critical:ci'
          }
          post {
            always {
              sh 'mkdir -p out/lanes/ui-critical'
              sh 'cp -r out/test-results out/lanes/ui-critical/test-results || true'
              sh 'cp -r out/playwright-report out/lanes/ui-critical/playwright-report || true'
            }
          }
        }
      }
    }

    stage('Allure report') {
      steps {
        sh 'npm run report:allure:generate || true'
      }
    }
  }

  post {
    always {
      junit testResults: 'out/test-results/junit.xml', allowEmptyResults: true

      archiveArtifacts(
        artifacts: 'out/playwright-report/**,out/test-results/**,out/allure-results/**,out/allure-report/**,out/allure-history/**,out/logs/**,out/lanes/**',
        allowEmptyArchive: true,
        fingerprint: true
      )

      script {
        if (fileExists('out/allure-report/index.html')) {
          publishHTML(target: [
            reportName: 'Allure Report',
            reportDir: 'out/allure-report',
            reportFiles: 'index.html',
            keepAll: true,
            alwaysLinkToLastBuild: true,
            allowMissing: true
          ])
        }
      }
    }
  }
}
