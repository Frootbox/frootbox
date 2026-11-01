<?php

/*
 * SPDX-License-Identifier: LGPL-3.0-only
 */

declare(strict_types=1);

namespace Frootbox\Backend\Tests\Http;

use Frootbox\Backend\Http\ActionHandler;
use Frootbox\Backend\Http\Media\MediaHandler;
use Frootbox\Backend\Http\Media\UploadHandler;
use Frootbox\Backend\Security\Csrf;
use Frootbox\Backend\Tests\Support\BackendTestCase;
use Frootbox\Core\ProjectPaths;
use Nyholm\Psr7\UploadedFile;
use PHPUnit\Framework\Attributes\CoversClass;
use Psr\Http\Message\ResponseInterface;

#[CoversClass(MediaHandler::class)]
#[CoversClass(UploadHandler::class)]
#[CoversClass(ActionHandler::class)]
final class MediaScreenTest extends BackendTestCase
{
    private string $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->createUser('editor@example.org', ['editor']);
        $this->session = $this->signIn('editor@example.org');
    }

    public function testUploadsAndShowsTheMedia(): void
    {
        $folder = $this->action('media.folder-create', ['name' => 'Team'], $this->session)['data'];
        self::assertIsArray($folder);
        $folderId = $folder['id'];
        self::assertIsString($folderId);
        $id = $this->upload('anna.jpg', $folderId);
        $this->upload('hafen.jpg');

        $html = $this->html($this->request('GET', '/cms/media', session: $this->session));
        self::assertStringContainsString('<h1 class="fb-heading-1">Medien</h1>', $html);
        self::assertStringContainsString('anna.jpg', $html);
        self::assertStringContainsString('hafen.jpg', $html);
        self::assertStringContainsString('<fb-upload class="fb-split__main" url="/cms/uploads"', $html);
        self::assertStringContainsString('href="/cms/media?folder=' . $folderId . '"', $html);

        $inFolder = $this->html($this->request('GET', '/cms/media?folder=' . $folderId, session: $this->session));
        self::assertStringContainsString('anna.jpg', $inFolder);
        self::assertStringNotContainsString('hafen.jpg', $inFolder);
        self::assertStringContainsString('folder="' . $folderId . '"', $inFolder);

        $found = $this->html($this->request('GET', '/cms/media?q=hafen', session: $this->session));
        self::assertStringNotContainsString('anna.jpg', $found);

        $unused = $this->html($this->request('GET', '/cms/media?unused=1', session: $this->session));
        self::assertStringContainsString('anna.jpg', $unused, 'No page uses them yet.');
        self::assertStringContainsString('name="unused" value="1" checked', $unused);

        $detail = $this->html($this->request('GET', '/cms/media/' . $id . '?folder=' . $folderId, session: $this->session));
        self::assertStringContainsString('<fb-focus class="fb-focus" x="0.5" y="0.5"', $detail);
        self::assertMatchesRegularExpression('/name="texts\.[a-z-]+\.alt"/', $detail);
        self::assertStringContainsString('href="/cms/media?folder=' . $folderId . '"', $detail, 'The way back keeps the filter.');
        self::assertStringContainsString('<option value="' . $folderId . '" selected>Team</option>', $detail);
        self::assertStringContainsString('Nirgends verwendet, auch nicht im Entwurf.', $detail);
        self::assertStringContainsString('Es wird nirgends verwendet.', $detail);

        $updated = $this->action('media.update', ['id' => $id, 'focusX' => 0.2, 'focusY' => 0.8, 'tags' => ['team']], $this->session)['data'];
        self::assertIsArray($updated);
        self::assertSame(['x' => 0.2, 'y' => 0.8], $updated['focus']);

        self::assertSame(404, $this->request('GET', '/cms/media/01JZZZZZZZZZZZZZZZZZZZZZZZ', session: $this->session)->getStatusCode());
    }

    public function testShowsAndPublishesTheDraftOfAPublicImage(): void
    {
        $id = $this->upload('hafen.jpg');
        // As if a published page used it.
        $this->connection()->executeStatement('UPDATE media SET public = ? WHERE id = ?', [1, $id]);

        self::assertStringContainsString('warten im Entwurf, bis Du sie veröffentlichst.', $this->html($this->request('GET', '/cms/media/' . $id, session: $this->session)));

        $this->action('media.update', ['id' => $id, 'focusX' => 0.2, 'focusY' => 0.5], $this->session);
        $detail = $this->html($this->request('GET', '/cms/media/' . $id, session: $this->session));
        self::assertStringContainsString('Änderungen offen', $detail);
        self::assertStringContainsString('Besucher sehen die Änderungen erst nach dem Veröffentlichen.', $detail);
        self::assertStringContainsString('<fb-form action="media.publish" refresh="media-detail"', $detail);
        self::assertStringContainsString('<dialog class="fb-dialog" id="media-discard"', $detail);
        self::assertStringContainsString('<fb-focus class="fb-focus" x="0.2" y="0.5"', $detail, 'The form shows the draft.');

        $changed = $this->html($this->request('GET', '/cms/media?changed=1', session: $this->session));
        self::assertStringContainsString('hafen.jpg', $changed);
        self::assertStringContainsString('name="changed" value="1" checked', $changed);

        $this->action('media.publish', ['ids' => [$id]], $this->session);
        $detail = $this->html($this->request('GET', '/cms/media/' . $id, session: $this->session));
        self::assertStringNotContainsString('Änderungen offen', $detail);
        self::assertStringNotContainsString('id="media-discard"', $detail);
    }

    public function testReplacesTheFileOfAPublicImageInTheDraft(): void
    {
        $id = $this->upload('hafen.jpg');
        $this->connection()->executeStatement('UPDATE media SET public = ? WHERE id = ?', [1, $id]);

        $detail = $this->html($this->request('GET', '/cms/media/' . $id, session: $this->session));
        self::assertStringContainsString('replace="' . $id . '" refresh="media-detail"', $detail);
        self::assertStringContainsString('Datei ersetzen', $detail);
        self::assertStringContainsString('done="Die neue Datei liegt im Entwurf."', $detail);

        $file = $this->image();
        $token = json_decode((string) $this->send(new UploadedFile($file, (int) filesize($file), \UPLOAD_ERR_OK, 'neu.jpg'))->getBody(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($token);
        self::assertIsArray($token['data']);
        $this->action('media.replace', ['id' => $id, 'upload' => $token['data']['upload']], $this->session);

        $detail = $this->html($this->request('GET', '/cms/media/' . $id, session: $this->session));
        self::assertStringContainsString('id="media-detail-title" tabindex="-1" data-fb-focus>neu.jpg</h2>', $detail, 'The library shows the draft.');
        self::assertStringContainsString('Änderungen offen', $detail);
        self::assertStringContainsString('Datei, Fokuspunkt und Texte gehen zurück', $detail);
    }

    public function testDeletesAnImageOnlyWithoutPublishedUse(): void
    {
        $id = $this->upload('hafen.jpg');
        // As if a published page used it.
        $this->connection()->executeStatement("INSERT INTO media_usages (media_id, owner_type, owner_id, language, published) VALUES (?, 'page', '01J00000000000000000000001', 'de', 1)", [$id]);

        $detail = $this->html($this->request('GET', '/cms/media/' . $id, session: $this->session));
        self::assertStringContainsString('Das Bild lässt sich noch nicht löschen', $detail);
        self::assertStringContainsString('Das Bild wird an 1 veröffentlichten Stelle genutzt.', $detail);

        $response = $this->request('POST', '/cms/actions/media.delete', session: $this->session, headers: [Csrf::HEADER => $this->csrfFor($this->session)], json: ['id' => $id]);
        self::assertSame(409, $response->getStatusCode());
        self::assertStringContainsString('Nimm es dort heraus und veröffentliche', (string) $response->getBody());

        $this->connection()->executeStatement('UPDATE media_usages SET published = 0 WHERE media_id = ?', [$id]);
        $detail = $this->html($this->request('GET', '/cms/media/' . $id, session: $this->session));
        self::assertStringContainsString('Es wird in 1 Entwurf genutzt. Dort zeigt es danach nichts mehr.', $detail);
        $this->action('media.delete', ['id' => $id], $this->session);
    }

    public function testExplainsWhatIsWrongWithAFile(): void
    {
        $file = $this->get(ProjectPaths::class)->var('shell.php');
        @mkdir(\dirname($file), 0o775, true);
        file_put_contents($file, '<?php echo 1;');

        $response = $this->send(new UploadedFile($file, (int) filesize($file), \UPLOAD_ERR_OK, 'shell.php'));
        self::assertSame(422, $response->getStatusCode());
        self::assertSame('application/problem+json', $response->getHeaderLine('Content-Type'));
        self::assertStringContainsString('Die Datei ist kein Bild im Format JPEG, PNG, WebP oder GIF.', (string) $response->getBody());

        $response = $this->send(new UploadedFile($file, 30 * 1024 * 1024, \UPLOAD_ERR_INI_SIZE, 'big.jpg'));
        self::assertStringContainsString('Die Datei ist zu groß', (string) $response->getBody());
    }

    public function testNeedsSignInPermissionAndToken(): void
    {
        $file = $this->image();

        self::assertSame(401, $this->request('POST', '/cms/uploads', files: ['file' => new UploadedFile($file, (int) filesize($file), \UPLOAD_ERR_OK, 'a.jpg')])->getStatusCode());
        self::assertSame(403, $this->request('POST', '/cms/uploads', session: $this->session, files: ['file' => new UploadedFile($file, (int) filesize($file), \UPLOAD_ERR_OK, 'a.jpg')])->getStatusCode(), 'Without the CSRF token.');

        $this->createUser('guest@example.org', []);
        $nobody = $this->signIn('guest@example.org');
        $response = $this->request('POST', '/cms/uploads', session: $nobody, headers: [Csrf::HEADER => $this->csrfFor($nobody)], files: ['file' => new UploadedFile($file, (int) filesize($file), \UPLOAD_ERR_OK, 'a.jpg')]);
        self::assertSame(403, $response->getStatusCode());

        $menu = $this->html($this->request('GET', '/cms', session: $nobody));
        self::assertStringNotContainsString('/cms/media"', $menu);
        self::assertStringContainsString('/cms/media"', $this->html($this->request('GET', '/cms', session: $this->session)));
    }

    protected function config(): array
    {
        return ['backend' => ['language' => 'de']];
    }

    private function upload(string $name, ?string $folder = null): string
    {
        $file = $this->image();
        $response = $this->send(new UploadedFile($file, (int) filesize($file), \UPLOAD_ERR_OK, $name));
        self::assertSame(201, $response->getStatusCode(), (string) $response->getBody());
        $body = json_decode((string) $response->getBody(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($body);
        self::assertIsArray($body['data']);
        self::assertSame($name, $body['data']['name']);

        $medium = $this->action('media.create', ['upload' => $body['data']['upload'], 'folderId' => $folder], $this->session)['data'];
        self::assertIsArray($medium);
        self::assertIsString($medium['id']);

        return $medium['id'];
    }

    private function send(UploadedFile $file): ResponseInterface
    {
        return $this->request('POST', '/cms/uploads', session: $this->session, headers: [Csrf::HEADER => $this->csrfFor($this->session), 'Accept' => 'application/json'], files: ['file' => $file]);
    }

    private function image(): string
    {
        $image = imagecreatetruecolor(64, 48);
        // Each image differs, or the library would find it again (decision 0146).
        imagefilledrectangle($image, 0, 0, 31, 47, (int) imagecolorallocate($image, random_int(0, 255), random_int(0, 255), random_int(0, 255)));
        $file = $this->get(ProjectPaths::class)->var('upload-' . bin2hex(random_bytes(4)) . '.jpg');
        @mkdir(\dirname($file), 0o775, true);
        imagejpeg($image, $file);

        return $file;
    }
}
