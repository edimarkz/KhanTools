/**
 * Khan Tools - Question Spoof
 * Simplifica as questões para respostas fáceis
 */

window.KhanTools = window.KhanTools || {};

window.KhanTools.QuestionSpoof = {
    
    originalFetch: null,
    
    init() {
        if (this.originalFetch) return; // Já inicializado
        
        this.originalFetch = window.fetch;
        this.interceptFetch();
        window.KhanTools.logger.log('Question Spoof inicializado');
    },
    
    interceptFetch() {
        const self = this;
        
        window.fetch = async function(input, init) {
            const originalResponse = await self.originalFetch.apply(this, arguments);
            
            if (!window.KhanTools.config.features.questionSpoof) {
                return originalResponse;
            }
            
            return await self.processQuestionResponse(originalResponse);
        };
    },
    
    async processQuestionResponse(originalResponse) {
        const clonedResponse = originalResponse.clone();

        try {
            const responseBody = await clonedResponse.text();
            let responseObj = JSON.parse(responseBody);

            if (responseObj?.data?.assessmentItem?.item?.itemData) {
                let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);
                
                if (itemData.question && itemData.question.content) {
                    const firstChar = itemData.question.content[0];
                    if (firstChar === firstChar.toUpperCase()) {
                        
                        // Simplificar a questão
                        itemData.answerArea = {
                            "calculator": false,
                            "chi2Table": false,
                            "periodicTable": false,
                            "tTable": false,
                            "zTable": false
                        };
                        
                        itemData.question.content = "Qual é a resposta correta? [[☃ radio 1]]";
                        
                        itemData.question.widgets = {
                            "radio 1": {
                                type: "radio",
                                options: {
                                    choices: [
                                        { content: "Esta é a resposta correta", correct: true },
                                        { content: "Esta é incorreta", correct: false },
                                        { content: "Esta também é incorreta", correct: false }
                                    ]
                                }
                            }
                        };
                        
                        responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                        
                        window.KhanTools.showToast('Questão simplificada!');
                        
                        return new Response(JSON.stringify(responseObj), {
                            status: originalResponse.status,
                            statusText: originalResponse.statusText,
                            headers: originalResponse.headers
                        });
                    }
                }
            }
        } catch (error) {
            window.KhanTools.logger.error(`Erro no QuestionSpoof: ${error.message}`);
        }

        return originalResponse;
    },
    
    destroy() {
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
            this.originalFetch = null;
            window.KhanTools.logger.log('Question Spoof desabilitado');
        }
    }
};