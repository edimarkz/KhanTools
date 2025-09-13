const originalFetch = window.fetch;
window.fetch = async function(input, init = {}) {
    // Extrai URL e body no início (pra Request ou init normal)
    let url = typeof input === 'string' ? input : (input.url || input);
    let body = null;
    let headers = init.headers || {};
    let method = init.method || 'GET';
    
    if (input instanceof Request) {
        body = await input.text();
        headers = input.headers;
        method = input.method;
    } else if (init.body) {
        body = init.body;
    }
    
    let modifiedInit = { ...init, method, headers };
    
    // Video Spoof: Altera e propaga de verdade
    if (features.videoSpoof && body && body.includes('"operationName":"updateUserVideoProgress"')) {
        try {
            let bodyObj = JSON.parse(body);
            if (bodyObj.variables && bodyObj.variables.input) {
                const durationSeconds = bodyObj.variables.input.durationSeconds;
                bodyObj.variables.input.secondsWatched = durationSeconds;
                bodyObj.variables.input.lastSecondWatched = durationSeconds;
                body = JSON.stringify(bodyObj);  // Body falso
                modifiedInit.body = body;  // Propaga pro init
                modifiedInit.headers = { ...modifiedInit.headers, 'Content-Type': 'application/json' };
                
                // Pausa o player rapidinho (opcional, como no UserScript)
                const videoElem = document.querySelector('video');
                if (videoElem) videoElem.pause();
                
                showToast("🎥 Vídeo exploitado (agora de verdade!)", 1000);
            }
        } catch (e) { logger.error(`Erro no VideoSpoof: ${e}`); }
    }
    
    // Chama o original com as mudanças!
    const response = await originalFetch(url, modifiedInit);
    
    // Question Spoof (deixa igual, funciona)
    const clonedResponse = response.clone();
    try {
        const responseBody = await clonedResponse.text();
        let responseObj = JSON.parse(responseBody);
        if (features.questionSpoof && responseObj?.data?.assessmentItem?.item?.itemData) {
            let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);
            if(itemData.question.content[0] === itemData.question.content[0].toUpperCase()){
                itemData.answerArea = { "calculator": false, "chi2Table": false, "periodicTable": false, "tTable": false, "zTable": false };
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
                showToast("🔓 Questão exploitada.", 1000);
                return new Response(JSON.stringify(responseObj), { 
                    status: response.status, 
                    statusText: response.statusText, 
                    headers: response.headers 
                });
            }
        }
    } catch (e) { logger.error(`Erro no QuestionSpoof: ${e}`); }
    
    return response;
};