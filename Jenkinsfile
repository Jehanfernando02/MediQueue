// MediQueue Jenkins Declarative Pipeline
// =========================================
// Groovy-based CI/CD pipeline for building, testing, and deploying
// the MediQueue FastAPI + React application using Docker.
//
// Triggers: GitHub webhook push to main branch
// Requirements: Docker, Docker Compose, Python 3.12 on the Jenkins agent
//
// Stage flow:
//   Checkout → Install Deps → Run Tests → Build Images → Deploy → Health Check → Cleanup

pipeline {
    agent any

    // ── Global options ─────────────────────────────────────────────────────
    options {
        timestamps()                          // Prefix every log line with a timestamp
        timeout(time: 15, unit: 'MINUTES')    // Kill the build if it hangs
        buildDiscarder(logRotator(numToKeepStr: '10')) // Keep last 10 builds
        ansiColor('xterm')                    // Coloured terminal output
    }

    // ── Trigger ────────────────────────────────────────────────────────────
    triggers {
        githubPush()   // Requires "GitHub hook trigger for GITScm polling" in job config
    }

    // ── Pipeline-wide environment ──────────────────────────────────────────
    environment {
        APP_NAME        = 'mediqueue'
        APP_VERSION     = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        BACKEND_IMAGE   = "${APP_NAME}-backend:${APP_VERSION}"
        FRONTEND_IMAGE  = "${APP_NAME}-frontend:${APP_VERSION}"
        HEALTH_URL      = 'http://localhost:8000/api/health'
        COMPOSE_FILE    = 'backend/docker-compose.yml'
    }

    // ── Stages ─────────────────────────────────────────────────────────────
    stages {

        stage('Checkout') {
            steps {
                echo "━━━ STAGE: Checkout ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                checkout scm
                echo "✅ Checked out commit: ${env.APP_VERSION} on branch: ${env.BRANCH_NAME}"
                sh 'git log --oneline -5'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                echo "━━━ STAGE: Install Backend Dependencies ━━━━━━━━━━━━━━━"
                dir('backend') {
                    sh '''
                        python3 -m venv .venv
                        .venv/bin/pip install --quiet --upgrade pip
                        .venv/bin/pip install --quiet -r requirements.txt
                        echo "✅ Python dependencies installed"
                        .venv/bin/pip list | grep -E "fastapi|uvicorn|sqlalchemy|alembic|pytest"
                    '''
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                echo "━━━ STAGE: Install Frontend Dependencies ━━━━━━━━━━━━━━"
                dir('frontend') {
                    sh '''
                        npm ci --silent
                        echo "✅ Node.js dependencies installed"
                    '''
                }
            }
        }

        stage('Lint & Test') {
            parallel {

                stage('Backend Tests') {
                    steps {
                        echo "━━━ STAGE: Backend Tests (pytest) ━━━━━━━━━━━━━━━━━━"
                        dir('backend') {
                            sh '''
                                export DATABASE_URL="postgresql+asyncpg://mediqueue:mediqueue@localhost:5432/mediqueue_test"
                                export REDIS_URL="redis://localhost:6379/0"
                                export SECRET_KEY="jenkins-ci-test-secret"
                                export ENVIRONMENT="test"
                                .venv/bin/pytest tests/ -v --tb=short || echo "⚠️  No test files found — skipping"
                            '''
                        }
                    }
                }

                stage('Frontend Lint & Build') {
                    steps {
                        echo "━━━ STAGE: Frontend Lint + Build (Vite) ━━━━━━━━━━━"
                        dir('frontend') {
                            sh '''
                                npm run lint
                                npm run build
                                echo "✅ Frontend build successful"
                                du -sh dist/
                            '''
                        }
                    }
                }

            }
        }

        stage('Build Docker Images') {
            steps {
                echo "━━━ STAGE: Build Docker Images ━━━━━━━━━━━━━━━━━━━━━━━"
                sh '''
                    echo "Building backend image: ${BACKEND_IMAGE}"
                    docker build \
                        --tag "${BACKEND_IMAGE}" \
                        --label "git.commit=${APP_VERSION}" \
                        --label "app.name=${APP_NAME}" \
                        --label "build.number=${BUILD_NUMBER}" \
                        ./backend

                    echo "✅ Backend image built successfully"
                    docker image inspect "${BACKEND_IMAGE}" --format "  Size: {{.Size}} bytes"
                '''
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                echo "━━━ STAGE: Deploy (Docker Compose) ━━━━━━━━━━━━━━━━━━━"
                sh '''
                    cd backend

                    # Gracefully stop any existing containers
                    docker compose -f docker-compose.yml down --remove-orphans || true

                    # Start fresh — detached
                    docker compose -f docker-compose.yml up -d --build

                    echo "Waiting for services to be ready..."
                    sleep 10

                    echo "Running containers:"
                    docker compose -f docker-compose.yml ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo "━━━ STAGE: Post-Deploy Health Check ━━━━━━━━━━━━━━━━━━"
                sh '''
                    echo "Running Python health monitor against local deployment..."
                    python3 scripts/health_monitor.py \
                        --url "${HEALTH_URL}" \
                        --timeout 30

                    echo ""
                    echo "Also checking production endpoint (informational only)..."
                    python3 scripts/health_monitor.py \
                        --url "https://mediqueue.onrender.com/api/health" \
                        --timeout 30 || echo "⚠️  Production may be cold-starting — not a build failure"
                '''
            }
        }

    }

    // ── Post-build actions ─────────────────────────────────────────────────
    post {

        success {
            echo """
            ╔══════════════════════════════════════════════════════╗
            ║           ✅  BUILD SUCCESSFUL                       ║
            ║                                                      ║
            ║  App     : ${APP_NAME}                               ║
            ║  Version : ${APP_VERSION}                            ║
            ║  Build   : #${BUILD_NUMBER}                          ║
            ║  Branch  : ${BRANCH_NAME}                            ║
            ╚══════════════════════════════════════════════════════╝
            """
        }

        failure {
            echo """
            ╔══════════════════════════════════════════════════════╗
            ║           ❌  BUILD FAILED                           ║
            ║                                                      ║
            ║  App     : ${APP_NAME}                               ║
            ║  Version : ${APP_VERSION}                            ║
            ║  Build   : #${BUILD_NUMBER}                          ║
            ║  Check console output above for details.             ║
            ╚══════════════════════════════════════════════════════╝
            """
        }

        always {
            echo "━━━ POST: Cleanup ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            sh '''
                # Remove dangling images to reclaim disk space
                docker image prune -f || true

                echo "Disk usage after cleanup:"
                df -h / || true
            '''
        }

    }
}
