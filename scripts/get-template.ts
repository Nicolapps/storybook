import { allTemplates, templatesByCadence } from '../code/lib/cli/src/repro-templates';

export type Cadence = keyof typeof templatesByCadence;
export type Template = {
  cadence?: readonly Cadence[];
  skipTasks?: string[];
  // there are other fields but we don't use them here
};
export type TemplateKey = keyof typeof allTemplates;

export async function getTemplate(
  cadence: Cadence,
  scriptName: string,
  { index, total }: { index: number; total: number }
) {
  let potentialTemplateKeys: TemplateKey[] = [];

  if (potentialTemplateKeys.length === 0) {
    const cadenceTemplates = Object.entries(allTemplates).filter(([key]) =>
      templatesByCadence[cadence].includes(key as TemplateKey)
    );
    potentialTemplateKeys = cadenceTemplates.map(([k]) => k) as TemplateKey[];
  }

  potentialTemplateKeys = potentialTemplateKeys.filter(
    (t) => !(allTemplates[t] as Template).skipTasks?.includes(scriptName)
  );

  if (potentialTemplateKeys.length !== total) {
    throw new Error(`Circle parallelism set incorrectly.
    
      Parallelism is set to ${total}, but there are ${
      potentialTemplateKeys.length
    } templates to run:
      ${potentialTemplateKeys.join(', ')}
    `);
  }

  return potentialTemplateKeys[index];
}

async function run() {
  const [, , cadence, scriptName] = process.argv;

  if (!cadence) throw new Error('Need to supply cadence to get template script');

  const { CIRCLE_NODE_INDEX = 0, CIRCLE_NODE_TOTAL = 1 } = process.env;

  console.log(
    await getTemplate(cadence as Cadence, scriptName, {
      index: +CIRCLE_NODE_INDEX,
      total: +CIRCLE_NODE_TOTAL,
    })
  );
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
