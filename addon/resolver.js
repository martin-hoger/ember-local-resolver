import Ember from 'ember'
const {
    Logger: {
        warn
    }
} = Ember
const Resolver = require('ember-resolver')['default']

Resolver.reopen({
    expandLocalLookup: function (targetFullName, sourceFullName) { 
        const modulePrefix = this.namespace.modulePrefix
        const podModulePrefix = this.namespace.podModulePrefix
        const parsedTarget = this.parseName(targetFullName)
        const parsedSource = this.parseName(sourceFullName)

        let sourceName = parsedSource.fullNameWithoutType
        let targetName = parsedTarget.fullNameWithoutType
        const targetType = parsedTarget.type

        if (parsedSource.type !== 'template') {
            warn(`
                Local lookup is currently not implemented outside of templates.
                If you have an additional use case, please open an issue on
                https://github.com/ciena-blueplanet/ember-local-resolver/issues
                to discuss.
            `)
            return `${parsedTarget.type}:${sourceName}/${targetName}`
        }

        // Remove the prefix and extension from the source module name
        // Using pods.
        if (sourceName.startsWith(podModulePrefix)) {
            const prefixLength = `${podModulePrefix}/`.length;
            const extensionLength = '/template/hbs'.length;
            sourceName = sourceName.slice(prefixLength, -extensionLength)

            // MH:
            // If the source is already a private component,
            // remove the component part.
            if (sourceName.indexOf('/-components') !== -1) {
                sourceName = sourceName.replace(/\/-components.*$/, '');
            }

            // In a pods structure local components/helpers are nested In
            // -components or -helpers directories to align with the module unification RFC
            // https://github.com/dgeb/rfcs/blob/module-unification/text/0000-module-unification.md#private-collections
            switch (targetType) {
                case 'component':
                    sourceName = `${sourceName}/-components`
                    break
                // MH:
                case 'template':
                    sourceName = `${sourceName}/-components`
                    break
                case 'helper':
                    sourceName = `${sourceName}/-helpers`
                    break
            }

        // When not using pods.
        } else if (sourceName.startsWith(modulePrefix)) {
            const prefixLength = `${modulePrefix}/templates/`.length
            const extensionLength = '/hbs'.length
            sourceName = sourceName.slice(prefixLength, -extensionLength)
        }

        // Remove the prefix from the target module name
        if (parsedTarget.type === 'template' && targetName.startsWith('components')) {
            const prefixLength = 'components/'.length
            targetName = targetName.slice(prefixLength)
        }

        return `${parsedTarget.type}:${sourceName}/${targetName}`
    }
})

export default Resolver
