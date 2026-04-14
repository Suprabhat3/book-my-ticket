"use client";

import React from "react";

interface SeatLayoutPreviewProps {
  regularRows: number;
  coupleRows: number;
  reclinerRows: number;
  totalCols: number;
  maxRenderRows?: number;
  maxRenderCols?: number;
}

export function SeatLayoutPreview({
  regularRows,
  coupleRows,
  reclinerRows,
  totalCols,
  maxRenderRows = 50,
  maxRenderCols = 50,
}: SeatLayoutPreviewProps) {
  const reg = Math.max(0, regularRows);
  const cpl = Math.max(0, coupleRows);
  const rec = Math.max(0, reclinerRows);
  const cols = Math.max(0, totalCols);
  
  const totalRows = reg + cpl + rec;
  const cap = (reg + cpl) * cols + rec * Math.floor(cols / 2);

  const getColumnBlocks = (total: number) => {
    if (total <= 0) return [];
    const cappedTotal = Math.min(total, maxRenderCols);
    const numBlocks = Math.max(1, Math.floor(cappedTotal / 10));
    const baseSize = Math.floor(cappedTotal / numBlocks);
    let remainder = cappedTotal % numBlocks;
    
    const blocks: number[] = [];
    for (let i = 0; i < numBlocks; i++) {
      if (remainder > 0) {
        blocks.push(baseSize + 1);
        remainder--;
      } else {
        blocks.push(baseSize);
      }
    }
    return blocks;
  };

  const normalBlocks = getColumnBlocks(cols);

  // Constants for display limits
  const visibleReg = Math.min(reg, maxRenderRows);
  const visibleCpl = Math.min(cpl, maxRenderRows);
  const visibleRec = Math.min(rec, Math.floor(maxRenderRows / 2)); // allow fewer recliners since they are larger
  const isCapped = 
    reg > visibleReg || 
    cpl > visibleCpl || 
    rec > visibleRec || 
    cols > maxRenderCols;

  return (
    <div className="w-full flex justify-center">
      <div className="bg-surface-container-low rounded-xl p-6 overflow-auto border border-surface-container-high flex flex-col items-center min-h-[160px] justify-center w-full max-w-4xl">
        <div className="w-2/3 h-6 bg-blue-300 rounded-t-full mb-10 shadow-sm flex items-center justify-center relative flex-shrink-0">
          <span className="text-[10px] font-bold text-blue-900 absolute tracking-widest">SCREEN</span>
        </div>
        
        {totalRows > 0 && cols > 0 ? (
          <div className="flex flex-col gap-2 sm:gap-3 mb-4 items-center">
            {/* Basic Rows */}
            {Array.from({ length: visibleReg }).map((_, r) => (
              <div key={`reg-${r}`} className="flex gap-4 sm:gap-6 justify-center w-full">
                {normalBlocks.map((blockSize, bIdx) => (
                  <div key={`reg-b-${r}-${bIdx}`} className="flex gap-1.5 sm:gap-2">
                    {Array.from({ length: blockSize }).map((_, c) => (
                      <div 
                        key={`reg-${r}-${bIdx}-${c}`} 
                        className="w-4 h-4 sm:w-6 sm:h-6 rounded-t-lg rounded-b-sm bg-blue-500/80 border border-blue-600/20 shadow-sm transition-transform hover:scale-125 hover:bg-blue-600 cursor-pointer"
                        title={`Basic Seat`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Premium Rows (Couple) */}
            {visibleReg > 0 && visibleCpl > 0 && <div className="h-2" />}
            {Array.from({ length: visibleCpl }).map((_, r) => (
              <div key={`cpl-${r}`} className="flex gap-4 sm:gap-6 justify-center w-full">
                {normalBlocks.map((blockSize, bIdx) => (
                  <div key={`cpl-b-${r}-${bIdx}`} className="flex gap-1.5 sm:gap-2">
                    {Array.from({ length: blockSize }).map((_, c) => (
                      <div 
                        key={`cpl-${r}-${bIdx}-${c}`} 
                        className="w-4 h-4 sm:w-6 sm:h-6 rounded-t-lg rounded-b-sm bg-rose-500/80 border border-rose-600/20 shadow-sm transition-transform hover:scale-125 hover:bg-rose-600 cursor-pointer"
                        title={`Premium Seat`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Recliner Rows */}
            {(visibleReg > 0 || visibleCpl > 0) && visibleRec > 0 && <div className="h-4" />}
            {Array.from({ length: visibleRec }).map((_, r) => (
              <div key={`rec-${r}`} className="flex gap-4 sm:gap-6 justify-center w-full">
                {normalBlocks.map((blockSize, bIdx) => {
                  const reclinerLength = Math.floor(blockSize / 2);
                  if (reclinerLength <= 0) return null;
                  return (
                    <div key={`rec-b-${r}-${bIdx}`} className="flex gap-1.5 sm:gap-2">
                      {Array.from({ length: reclinerLength }).map((_, c) => (
                        <div 
                          key={`rec-${r}-${bIdx}-${c}`} 
                          className="w-10 h-5 sm:w-14 sm:h-7 rounded-t-xl rounded-b-md bg-amber-500/80 border border-amber-600/20 shadow-sm transition-transform hover:scale-110 hover:bg-amber-600 cursor-pointer"
                          title={`Recliner`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-on-surface-variant my-8">
            <span className="font-semibold">Enter screen dimensions</span>
            <span className="text-sm">e.g. 10 rows × 20 columns</span>
          </div>
        )}
        
        {isCapped && (
          <div className="text-center text-xs text-on-surface-variant mt-4 max-w-md bg-surface-container-high px-4 py-2 rounded-lg">
            Preview is visually capped to prevent browser slowdowns. Actual capacity ({cap} seats) will be safely saved in the layout manifest.
          </div>
        )}
      </div>
    </div>
  );
}
