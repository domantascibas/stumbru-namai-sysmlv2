# OpenSysML (`sysml` command line tool) plus the live model viewer.
#
#   podman build -t stumbru-sysml .
#   podman run --rm -p 5175:5175 -v "$PWD":/work stumbru-sysml        # viewer on http://localhost:5175
#   podman run --rm -v "$PWD":/work stumbru-sysml sysml -validate model
#   podman run --rm -it -v "$PWD":/work stumbru-sysml sysml model      # interactive REPL

ARG OPENSYSML_VERSION=v0.11.0

FROM docker.io/library/golang:1.25-bookworm AS opensysml
ARG OPENSYSML_VERSION
# Static binary, so it runs in any base image.
RUN CGO_ENABLED=0 go install github.com/Open-MBEE/OpenSysML/cmd/sysml@${OPENSYSML_VERSION}

FROM docker.io/library/node:22-bookworm-slim
COPY --from=opensysml /go/bin/sysml /usr/local/bin/sysml
COPY viewer /opt/viewer

# The repository is mounted here, so `sysml ... model` and the viewer both
# see the model files as they are edited on the host.
WORKDIR /work
ENV HOST=0.0.0.0 \
    PORT=5175
EXPOSE 5175
CMD ["node", "/opt/viewer/server.js", "--model", "/work/model"]
