/**
 * Matrix values used by Canvas 2D transform APIs.
 */
interface MatrixValues {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

/**
 * Returns an HTML input element by id.
 * @param id - Target element id.
 * @returns Matching input element.
 */
function getInput(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Input #${id} was not found.`);
  }
  return element;
}

/**
 * Returns an HTML button element by id.
 * @param id - Target element id.
 * @returns Matching button element.
 */
function getButton(id: string): HTMLButtonElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Button #${id} was not found.`);
  }
  return element;
}

/**
 * Parses a number from an input element.
 * @param input - Source input element.
 * @returns Numeric value from the input.
 */
function getNumericValue(input: HTMLInputElement): number {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Converts degrees into radians.
 * @param degrees - Degree angle.
 * @returns Radian angle.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Reads matrix values from the matrix form.
 * @returns Matrix values in canvas argument order.
 */
function getMatrixFormValues(): MatrixValues {
  return {
    a: getNumericValue(getInput("m-a")),
    b: getNumericValue(getInput("m-b")),
    c: getNumericValue(getInput("m-c")),
    d: getNumericValue(getInput("m-d")),
    e: getNumericValue(getInput("m-e")),
    f: getNumericValue(getInput("m-f")),
  };
}

/**
 * Writes matrix values back to the matrix form.
 * @param matrix - Matrix values to display.
 */
function setMatrixFormValues(matrix: MatrixValues): void {
  getInput("m-a").value = matrix.a.toFixed(4);
  getInput("m-b").value = matrix.b.toFixed(4);
  getInput("m-c").value = matrix.c.toFixed(4);
  getInput("m-d").value = matrix.d.toFixed(4);
  getInput("m-e").value = matrix.e.toFixed(2);
  getInput("m-f").value = matrix.f.toFixed(2);
}

/**
 * Updates matrix output with the current context transform.
 * @param ctx - Canvas rendering context.
 */
function renderMatrixOutput(ctx: CanvasRenderingContext2D): void {
  const matrix = ctx.getTransform();
  const output = document.getElementById("matrix-output");
  if (!output) {
    return;
  }

  output.textContent = [
    `a: ${matrix.a.toFixed(4)}   b: ${matrix.b.toFixed(4)}`,
    `c: ${matrix.c.toFixed(4)}   d: ${matrix.d.toFixed(4)}`,
    `e: ${matrix.e.toFixed(2)}   f: ${matrix.f.toFixed(2)}`,
  ].join("\n");

  setMatrixFormValues({
    a: matrix.a,
    b: matrix.b,
    c: matrix.c,
    d: matrix.d,
    e: matrix.e,
    f: matrix.f,
  });
}

/**
 * Adjusts canvas pixel dimensions to match visible dimensions.
 * @param canvas - Canvas element.
 */
function resizeCanvas(canvas: HTMLCanvasElement): void {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(bounds.width));
  const height = Math.max(1, Math.floor(bounds.height));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

/**
 * Returns the main canvas element.
 * @returns Canvas element.
 */
function getCanvas(): HTMLCanvasElement {
  const element = document.getElementById("video-canvas");
  if (!(element instanceof HTMLCanvasElement)) {
    throw new Error("#video-canvas was not found.");
  }
  return element;
}

/**
 * Returns a 2D canvas rendering context for the provided canvas.
 * @param canvas - Canvas element.
 * @returns 2D rendering context.
 */
function getContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D canvas context is unavailable.");
  }
  return context;
}

const canvas = getCanvas();
const ctx = getContext2D(canvas);

const sourceVideo = document.createElement("video");
sourceVideo.loop = true;
sourceVideo.muted = true;
sourceVideo.playsInline = true;

let videoUrl: string | null = null;

/**
 * Draws the current video frame into canvas using active transform state.
 */
function drawFrame(): void {
  resizeCanvas(canvas);
  const { width, height } = canvas;

  const matrixBeforeDraw = ctx.getTransform();

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.restore();

  if (sourceVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    ctx.drawImage(sourceVideo, 0, 0, width, height);
  }

  ctx.setTransform(matrixBeforeDraw);
  renderMatrixOutput(ctx);
  requestAnimationFrame(drawFrame);
}

/**
 * Initializes all event handlers for video and transform controls.
 */
function initializeControls(): void {
  const fileInput = getInput("video-file");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    videoUrl = URL.createObjectURL(file);
    sourceVideo.src = videoUrl;
    void sourceVideo.play();
  });

  getButton("play-btn").addEventListener("click", () => {
    void sourceVideo.play();
  });

  getButton("pause-btn").addEventListener("click", () => {
    sourceVideo.pause();
  });

  getButton("apply-scale").addEventListener("click", () => {
    const scaleX = getNumericValue(getInput("scale-x"));
    const scaleY = getNumericValue(getInput("scale-y"));
    ctx.scale(scaleX, scaleY);
    renderMatrixOutput(ctx);
  });

  getButton("apply-rotate").addEventListener("click", () => {
    const degrees = getNumericValue(getInput("rotate-deg"));
    ctx.rotate(toRadians(degrees));
    renderMatrixOutput(ctx);
  });

  getButton("apply-translate").addEventListener("click", () => {
    const x = getNumericValue(getInput("translate-x"));
    const y = getNumericValue(getInput("translate-y"));
    ctx.translate(x, y);
    renderMatrixOutput(ctx);
  });

  getButton("apply-transform").addEventListener("click", () => {
    const { a, b, c, d, e, f } = getMatrixFormValues();
    ctx.transform(a, b, c, d, e, f);
    renderMatrixOutput(ctx);
  });

  getButton("apply-set-transform").addEventListener("click", () => {
    const { a, b, c, d, e, f } = getMatrixFormValues();
    ctx.setTransform(a, b, c, d, e, f);
    renderMatrixOutput(ctx);
  });

  getButton("reset-transform").addEventListener("click", () => {
    ctx.resetTransform();
    renderMatrixOutput(ctx);
  });

  getButton("sync-get-transform").addEventListener("click", () => {
    const matrix = ctx.getTransform();
    setMatrixFormValues({
      a: matrix.a,
      b: matrix.b,
      c: matrix.c,
      d: matrix.d,
      e: matrix.e,
      f: matrix.f,
    });
    renderMatrixOutput(ctx);
  });
}

initializeControls();
renderMatrixOutput(ctx);
requestAnimationFrame(drawFrame);
