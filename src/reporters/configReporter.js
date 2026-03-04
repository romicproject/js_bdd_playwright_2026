// reporters/configReporter.js
import { config } from '../../config/envConfig.js';

function buildConfigSummary() {
    return (
        `\n🔧 Configuration Loaded:\n` +
        `   Environment: ${config.env}\n` +
        `   API Base URL: ${config.apiBaseUrl}\n` +
        `   Request Timeout: ${config.timeout.request}ms\n` +
        `   Debug Mode: ${config.debug.enabled}\n`
    );
}

export default class ConfigReporter {
    onBegin() {
        if (!config.debug.enabled) return;
        console.log(buildConfigSummary());

    }
}
