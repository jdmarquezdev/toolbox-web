<script lang="ts">
  import { adminPath } from "$lib/paths";
</script>

<section class="card login-card">
  <h1 class="panel-title">Login admin</h1>
  <form class="grid" method="post" action={adminPath("/api/auth/login")}>
    <label>
      <span class="muted">Email</span>
      <input name="email" type="email" required />
    </label>
    <label>
      <span class="muted">Password</span>
      <input name="password" type="password" required />
    </label>
    <button class="btn primary" type="submit">Entrar</button>
  </form>
</section>
