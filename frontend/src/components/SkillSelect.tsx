"use client";

import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";

type Skill = {
  id: string;
  name: string;
  color: string;
};

const availableSkills: Skill[] = [
  { id: "grok", name: "Grok", color: "bg-red-700 hover:bg-red-800" },
  { id: "twitter", name: "Twitter", color: "bg-orange-500 hover:bg-orange-600" },
  {
    id: "rainbowkit",
    name: "Rainbowkit",
    color: "bg-yellow-500 hover:bg-yellow-600",
  },
  { id: "canva", name: "Canva", color: "bg-orange-700 hover:bg-orange-800" },
  {
    id: "defiant",
    name: "Defiant",
    color: "bg-pink-500 hover:bg-pink-600",
  },
  { id: "nextjs", name: "NextJs", color: "bg-indigo-500 hover:bg-indigo-600" },
  { id: "solity", name: "Solity", color: "bg-teal-500 hover:bg-teal-600" },
  { id: "notion", name: "Notion", color: "bg-gray-800 hover:bg-gray-900" },
  { id: "vercel", name: "Vercel", color: "bg-slate-500 hover:bg-slate-600" },
];

function DraggableSkill({ skill }: { skill: Skill }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: skill.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="m-1"
    >
      <Badge
        className={`cursor-grab active:cursor-grabbing text-white ${skill.color}`}
      >
        {skill.name}
      </Badge>
    </div>
  );
}

function DroppableArea({
  selectedSkills,
  onRemoveSkill,
}: {
  selectedSkills: Skill[];
  onRemoveSkill: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "skills-dropzone",
  });

  const borderColor = isOver ? "border-blue-500" : "border-gray-300";
  const bgColor = isOver ? "bg-orange-50" : "bg-transparent";

  return (
    <div
      ref={setNodeRef}
      className={`w-full min-h-[100px] border-2 ${borderColor} border-dashed rounded-lg p-4 transition-colors ${bgColor}`}
    >
      <div className="font-medium text-sm text-gray-500 mb-2">
        Drop skills here
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((skill) => (
          <Badge
            key={skill.id}
            className={`cursor-pointer text-white ${skill.color}`}
            onClick={() => onRemoveSkill(skill.id)}
          >
            {skill.name} ✕
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SkillSelect({
  onSkillsChange,
  initialSkills = [],
}: {
  onSkillsChange: (skills: string[]) => void;
  initialSkills?: string[];
}) {
  const prevInitialSkillsRef = useRef<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(() => {
    return initialSkills
      .map((skillId) => availableSkills.find((s) => s.id === skillId))
      .filter((skill): skill is Skill => skill !== undefined);
  });

  // Only update selectedSkills when initialSkills actually changes
  useEffect(() => {
    const initialSkillsString = JSON.stringify(initialSkills);
    const prevInitialSkillsString = JSON.stringify(
      prevInitialSkillsRef.current
    );

    if (initialSkillsString !== prevInitialSkillsString) {
      const newSelectedSkills = initialSkills
        .map((skillId) => availableSkills.find((s) => s.id === skillId))
        .filter((skill): skill is Skill => skill !== undefined);

      setSelectedSkills(newSelectedSkills);
      prevInitialSkillsRef.current = initialSkills;
    }
  }, [initialSkills]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over?.id === "skills-dropzone" && selectedSkills.length < 4) {
      const skill = availableSkills.find((s) => s.id === active.id);
      if (skill && !selectedSkills.find((s) => s.id === skill.id)) {
        const newSelectedSkills = [...selectedSkills, skill];
        setSelectedSkills(newSelectedSkills);
        onSkillsChange(newSelectedSkills.map((s) => s.id));
      }
    }
  };

  const handleRemoveSkill = (id: string) => {
    const newSelectedSkills = selectedSkills.filter((s) => s.id !== id);
    setSelectedSkills(newSelectedSkills);
    onSkillsChange(newSelectedSkills.map((s) => s.id));
  };

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToWindowEdges]}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {availableSkills.map((skill) => (
            <DraggableSkill key={skill.id} skill={skill} />
          ))}
        </div>
        <DroppableArea
          selectedSkills={selectedSkills}
          onRemoveSkill={handleRemoveSkill}
        />
      </div>
    </DndContext>
  );
}

export default SkillSelect;
