using System;
using System.ComponentModel;
using System.Windows.Forms;

namespace ECS;

public class AlignForm : Form
{
	private IContainer components;

	private Button leftTopButton;

	private Button centerTopButton;

	private Button rightTopButton;

	private Button leftButton;

	private Button centerButton;

	private Button rightButton;

	private Button leftBottomButton;

	private Button centerBottomButton;

	private Button rightBottomButton;

	private int _align;

	public int Align
	{
		get
		{
			return _align;
		}
		set
		{
			_align = value;
		}
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.AlignForm));
		this.leftTopButton = new System.Windows.Forms.Button();
		this.centerTopButton = new System.Windows.Forms.Button();
		this.rightTopButton = new System.Windows.Forms.Button();
		this.leftButton = new System.Windows.Forms.Button();
		this.centerButton = new System.Windows.Forms.Button();
		this.rightButton = new System.Windows.Forms.Button();
		this.leftBottomButton = new System.Windows.Forms.Button();
		this.centerBottomButton = new System.Windows.Forms.Button();
		this.rightBottomButton = new System.Windows.Forms.Button();
		base.SuspendLayout();
		this.leftTopButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.leftTopButton, "leftTopButton");
		this.leftTopButton.Name = "leftTopButton";
		this.leftTopButton.UseVisualStyleBackColor = true;
		this.leftTopButton.Click += new System.EventHandler(leftTopButton_Click);
		this.centerTopButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.centerTopButton, "centerTopButton");
		this.centerTopButton.Name = "centerTopButton";
		this.centerTopButton.UseVisualStyleBackColor = true;
		this.centerTopButton.Click += new System.EventHandler(centerTopButton_Click);
		this.rightTopButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.rightTopButton, "rightTopButton");
		this.rightTopButton.Name = "rightTopButton";
		this.rightTopButton.UseVisualStyleBackColor = true;
		this.rightTopButton.Click += new System.EventHandler(rightTopButton_Click);
		this.leftButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.leftButton, "leftButton");
		this.leftButton.Name = "leftButton";
		this.leftButton.UseVisualStyleBackColor = true;
		this.leftButton.Click += new System.EventHandler(leftButton_Click);
		this.centerButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.centerButton, "centerButton");
		this.centerButton.Name = "centerButton";
		this.centerButton.UseVisualStyleBackColor = true;
		this.centerButton.Click += new System.EventHandler(centerButton_Click);
		this.rightButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.rightButton, "rightButton");
		this.rightButton.Name = "rightButton";
		this.rightButton.UseVisualStyleBackColor = true;
		this.rightButton.Click += new System.EventHandler(rightButton_Click);
		this.leftBottomButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.leftBottomButton, "leftBottomButton");
		this.leftBottomButton.Name = "leftBottomButton";
		this.leftBottomButton.UseVisualStyleBackColor = true;
		this.leftBottomButton.Click += new System.EventHandler(leftBottomButton_Click);
		this.centerBottomButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.centerBottomButton, "centerBottomButton");
		this.centerBottomButton.Name = "centerBottomButton";
		this.centerBottomButton.UseVisualStyleBackColor = true;
		this.centerBottomButton.Click += new System.EventHandler(centerBottomButton_Click);
		this.rightBottomButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		resources.ApplyResources(this.rightBottomButton, "rightBottomButton");
		this.rightBottomButton.Name = "rightBottomButton";
		this.rightBottomButton.UseVisualStyleBackColor = true;
		this.rightBottomButton.Click += new System.EventHandler(rightBottomButton_Click);
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.rightBottomButton);
		base.Controls.Add(this.centerBottomButton);
		base.Controls.Add(this.leftBottomButton);
		base.Controls.Add(this.rightButton);
		base.Controls.Add(this.centerButton);
		base.Controls.Add(this.leftButton);
		base.Controls.Add(this.rightTopButton);
		base.Controls.Add(this.centerTopButton);
		base.Controls.Add(this.leftTopButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "AlignForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(AlignForm_Load);
		base.ResumeLayout(false);
	}

	public AlignForm()
	{
		InitializeComponent();
	}

	private void leftTopButton_Click(object sender, EventArgs e)
	{
		_align = 1;
		Close();
	}

	private void centerTopButton_Click(object sender, EventArgs e)
	{
		_align = 2;
		Close();
	}

	private void rightTopButton_Click(object sender, EventArgs e)
	{
		_align = 3;
		Close();
	}

	private void leftButton_Click(object sender, EventArgs e)
	{
		_align = 4;
		Close();
	}

	private void centerButton_Click(object sender, EventArgs e)
	{
		_align = 5;
		Close();
	}

	private void rightButton_Click(object sender, EventArgs e)
	{
		_align = 6;
		Close();
	}

	private void leftBottomButton_Click(object sender, EventArgs e)
	{
		_align = 7;
		Close();
	}

	private void centerBottomButton_Click(object sender, EventArgs e)
	{
		_align = 8;
		Close();
	}

	private void rightBottomButton_Click(object sender, EventArgs e)
	{
		_align = 9;
		Close();
	}

	private void AlignForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_SnaptoGrid");
		centerBottomButton.Text = Program.GetLang("pw_BottomCenter");
		centerButton.Text = Program.GetLang("pw_MiddleCenter");
		centerTopButton.Text = Program.GetLang("pw_TopCenter");
		leftBottomButton.Text = Program.GetLang("pw_BottomLeft");
		leftButton.Text = Program.GetLang("pw_MiddleLeft");
		leftTopButton.Text = Program.GetLang("pw_TopLeft");
		rightBottomButton.Text = Program.GetLang("pw_BottomRight");
		rightButton.Text = Program.GetLang("pw_MiddleRight");
		rightTopButton.Text = Program.GetLang("pw_TopRight");
	}
}
