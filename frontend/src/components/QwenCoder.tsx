/* eslint-disable @next/next/no-assign-module-variable */


import React, { useState, useEffect, ReactElement } from "react";
import { transform } from "@babel/standalone";
import { pixelify_sans } from "@/app/fonts";

const createComponent = (code: string): React.ComponentType<any> | null => {
  try {
    const transpiled = transform(code, {
      presets: ["react", "typescript"],
    }).code;

    if (!transpiled) {
      console.error("Transpilation failed: No code generated");
      return null;
    }

    const exports: { [key: string]: any } = {};
    const module: { exports: typeof exports } = { exports };

    // Evaluate the transpiled code using the Function constructor
    const ComponentFactory = new Function(
      "React",
      "module",
      "exports",
      transpiled
    );
    ComponentFactory(React, module, exports);

    // Return the default export or the first exported component
    return module.exports.default || Object.values(module.exports)[0];
  } catch (error) {
    console.error("Component creation error:", error);
    return null;
  }
};

export const CodeEditor: React.FC<{ code: string }> = ({ code }) => {
  return (
    <div className={`${pixelify_sans.className} h-screen overflow-y-auto p-4`}>
      <div className="bg-gray-900 p-4 rounded-lg">
        <h3 className="text-xl text-white mb-4">Page.tsx</h3>
        <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
          {code}
        </pre>
      </div>
    </div>
  );
};

export const CodePreview: React.FC<{ code: string }> = ({
  code,
}): ReactElement => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(
    null
  );

  useEffect(() => {
    if (code) {
      const comp = createComponent(code);
      setComponent(comp);
    }
  }, [code]);

  if (!Component) {
    return (
      <div className={`${pixelify_sans.className} p-4`}>Loading preview...</div>
    );
  }

  return (
    <div className={`${pixelify_sans.className} h-screen overflow-y-auto`}>
      <Component />
    </div>
  );
};
