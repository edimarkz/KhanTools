/**
 * Khan Tools - Video Spoof
 * Completa automaticamente os vídeos da Khan Academy
 */

window.KhanTools = window.KhanTools || {};

window.KhanTools.VideoSpoof = {
    
    originalFetch: null,
    
    init() {
        if (this.originalFetch) return; // Já inicializado
        
        this.originalFetch = window.fetch;
        this.interceptFetch();
        window.KhanTools.logger.log('Video Spoof inicializado');
    },
    
    interceptFetch() {
        const self = this;
        
        window.fetch = async function(input, init = {}) {
            let fetchUrl = typeof input === 'string' ? input : input.url;
            let fetchBody = init.body || null;

            if (input instanceof Request) {
                try {
                    fetchBody = await input.clone().text();
                } catch (e) {
                    fetchBody = null;
                }
            }

            if (window.KhanTools.config.features.videoSpoof && 
                fetchBody && 
                fetchBody.includes('"operationName":"updateUserVideoProgress"')) {
                
                return await self.handleVideoProgress(fetchUrl, fetchBody, init);
            }

            return self.originalFetch(input, init);
        };
    },
    
    async handleVideoProgress(fetchUrl, fetchBody, init) {
        try {
            const bodyObj = JSON.parse(fetchBody);
            const inputData = bodyObj.variables.input;
            const contentId = inputData.contentId;
            const duration = inputData.durationSeconds;

            if (window.KhanTools.state.processedVideos.has(contentId)) {
                return this.createFakeVideoResponse();
            }

            window.KhanTools.state.processedVideos.add(contentId);
            
            // Progresso gradual em checkpoints
            const checkpoints = [0.25, 0.5, 0.75, 0.98, 1.0];
            const baseVariables = { ...bodyObj.variables };
            
            for (let i = 0; i < checkpoints.length; i++) {
                await window.KhanTools.sleep(800);
                const progress = checkpoints[i];
                const seconds = progress === 1.0 ? duration : Math.floor(duration * progress);
                
                baseVariables.input.secondsWatched = seconds;
                baseVariables.input.lastSecondWatched = seconds;

                const newBody = JSON.stringify({
                    operationName: bodyObj.operationName,
                    query: bodyObj.query,
                    variables: baseVariables
                });

                try {
                    await this.originalFetch(fetchUrl, { ...init, body: newBody });
                    window.KhanTools.logger.log(`Video Checkpoint ${Math.round(progress * 100)}% enviado`);
                } catch (error) {
                    window.KhanTools.logger.error(`Erro no checkpoint: ${error.message}`);
                }
            }

            window.KhanTools.showToast('Vídeo completado!');
            return this.createFakeVideoResponse();
            
        } catch (error) {
            window.KhanTools.logger.error(`Erro no VideoSpoof: ${error.message}`);
            return this.originalFetch(input, init);
        }
    },
    
    createFakeVideoResponse() {
        const fakeData = {
            data: {
                updateUserVideoProgress: {
                    videoItemProgress: {
                        progressPercent: 1,
                        __typename: "VideoItemProgress"
                    },
                    error: null
                }
            }
        };
        return Promise.resolve(new Response(JSON.stringify(fakeData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
    },
    
    destroy() {
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
            this.originalFetch = null;
            window.KhanTools.logger.log('Video Spoof desabilitado');
        }
    }
};