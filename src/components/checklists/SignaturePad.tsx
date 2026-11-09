"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Eraser, Undo2 } from "lucide-react";

const LARGURA = 800;
const ALTURA = 300; // same 400x150 proportion as the signature box of the document

type Ponto = { x: number; y: number };

/** Signature drawn with the finger; reports a PNG (data URL), or null while it is empty. */
export function SignaturePad({ label, onChange }: { label: string; onChange: (png: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracos = useRef<Ponto[][]>([]);
  const desenhando = useRef(false);

  const redesenhar = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, LARGURA, ALTURA);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const traco of tracos.current) {
      ctx.beginPath();
      traco.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      if (traco.length === 1) ctx.lineTo(traco[0].x + 0.1, traco[0].y);
      ctx.stroke();
    }
  }, []);

  useEffect(redesenhar, [redesenhar]);

  const publicar = () => onChange(tracos.current.length ? (canvasRef.current?.toDataURL("image/png") ?? null) : null);

  const ponto = (e: React.PointerEvent<HTMLCanvasElement>): Ponto => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * LARGURA, y: ((e.clientY - r.top) / r.height) * ALTURA };
  };

  const alterar = (acao: () => void) => {
    acao();
    redesenhar();
    publicar();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11.5px] font-semibold text-slate-700">{label}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => alterar(() => tracos.current.pop())} aria-label={`Desfazer traço: ${label}`} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <Undo2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => alterar(() => (tracos.current = []))} aria-label={`Apagar: ${label}`} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={LARGURA}
        height={ALTURA}
        aria-label={label}
        className="w-full max-w-[480px] aspect-[8/3] rounded-xl border border-slate-300 bg-white"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          desenhando.current = true;
          tracos.current.push([ponto(e)]);
          redesenhar();
        }}
        onPointerMove={(e) => {
          if (!desenhando.current) return;
          tracos.current[tracos.current.length - 1].push(ponto(e));
          redesenhar();
        }}
        onPointerUp={() => {
          if (!desenhando.current) return;
          desenhando.current = false;
          publicar();
        }}
        onPointerCancel={() => (desenhando.current = false)}
      />
    </div>
  );
}
