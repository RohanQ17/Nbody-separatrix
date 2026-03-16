// Leapfrog kick-drift-kick integration kernel.
// This shader performs one full leapfrog step:
//   1. Half-kick: v += 0.5 * a * dt
//   2. Drift:     x += v * dt
//   3. (Gravity is recomputed externally)
//   4. Half-kick: v += 0.5 * a * dt
//
// This shader handles steps 1+2 (first pass) or step 4 (second pass)
// depending on the uniform mode flag.

struct Uniforms {
  n:         u32,
  dt:        f32,
  softening: f32,
  mode:      u32,   // 0 = half-kick + drift, 1 = half-kick only
};

@group(0) @binding(0) var<storage, read_write> positions:     array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> velocities:    array<vec4<f32>>;
@group(0) @binding(2) var<storage, read>       masses:        array<f32>;
@group(0) @binding(3) var<storage, read>       accelerations: array<vec4<f32>>;
@group(0) @binding(4) var<uniform>             uniforms:      Uniforms;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= uniforms.n) { return; }

  let half_dt = uniforms.dt * 0.5;
  let acc = accelerations[i].xyz;

  // Half-kick
  var vel = velocities[i].xyz + acc * half_dt;

  // Drift (only in mode 0)
  if (uniforms.mode == 0u) {
    let pos = positions[i].xyz + vel * uniforms.dt;
    positions[i] = vec4<f32>(pos, 0.0);
  }

  velocities[i] = vec4<f32>(vel, 0.0);
}
